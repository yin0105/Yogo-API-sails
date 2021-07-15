const querystring = require('querystring')
require('require-sql')
const moment = require('moment')
const currencyDkk = require('../../filters/currency_dkk')
const crypto = require('crypto')
const receipt = require('../../helpers/email/customer/receipt')

module.exports = async (options) => {

  membership = await Membership.findOne(options.membershipId)
    .populate('client')
    .populate('user')
    .populate('payment_subscriptions', {archived: false, status: 'active'})
    .populate('payment_option')
    .populate('membership_type')


  if (membership.payment_subscriptions.length > 1) {
    throw new Error('More than one payment subscription for membership with id: ' + membership.id)
  }

  let order = await Order.create({
    client: membership.client.id,
    user: membership.user.id,
    total: membership.payment_option.payment_amount,
    test: !sails.config.productionPayments,
    membership: membership.id,
    payment_subscription: membership.payment_subscriptions[0].id,
  }).fetch()

  const monthUnitName = membership.payment_option.number_of_months_payment_covers > 1 ? 'måneder' : 'måned'

  // Set new paid_until date.
  let newPaidUntil = moment(membership.paid_until)
    .add(1, 'day')
    .add(membership.payment_option.number_of_months_payment_covers, 'months')
    .subtract(1, 'day')

  const orderItemName = membership.membership_type.name + '. ' +
    (membership.real_user_is_someone_else ? 'Bruger: ' + membership.real_user_name + '. ' : '') +
    ' Betaling for ' + membership.payment_option.number_of_months_payment_covers + ' ' + monthUnitName + ', fra ' + moment(membership.paid_until).add(1, 'day').format('D. MMMM YYYY') + ' til ' + newPaidUntil.format('D. MMMM YYYY')

  await OrderItem.create({
    client: membership.client.id,
    order: order.id,
    item_type: 'membership_renewal',
    item_id: membership.id,
    name: orderItemName,
    count: 1,
    item_price: membership.payment_option.payment_amount,
    total_price: membership.payment_option.payment_amount,
    membership_renewal_membership_type: membership.membership_type.id,
  }).fetch()


  const subscriptionTransaction = await PaymentSubscriptionTransaction.create({
    amount: order.total,
    status: 'pending',
    client: membership.client.id,
    payment_subscription: membership.payment_subscriptions[0].id,
  }).fetch()


  await sails.helpers.cron.log('About to call ticket_auth')


  const transactionResponse = await DibsPaymentService.ticketAuth({
    merchant: membership.client.dibs_merchant,
    ticket: membership.payment_subscriptions[0].payment_provider_subscription_id,
    amount: order.total,
    orderid: order.id,
    test: order.test,
  })

  await sails.helpers.cron.log('transactionResponse:' + transactionResponse)

  const transactionResponseData = querystring.parse(transactionResponse)

  await sails.helpers.cron.log('transactionResponseData: ' + JSON.stringify(transactionResponseData))

  if (transactionResponseData.status === 'ACCEPTED') {

    await Order.update({
      id: order.id,
    }, {
      paid: new Date(),
      pay_type: transactionResponseData.cardtype,
      card_last_4_digits: transactionResponseData.cardnomask ? transactionResponseData.cardnomask.substr(12, 4) : '',
      card_prefix: transactionResponseData.cardprefix ? transactionResponseData.cardprefix : '',
    })


    await PaymentSubscriptionTransaction.update({id: subscriptionTransaction.id}, {
      status: 'accepted',
      transaction_id: transactionResponseData.transact,
      approvalcode: transactionResponseData.approvalcode,
    })


    await Membership.update({
      id: membership.id,
    }, {
      paid_until: newPaidUntil.format('YYYY-MM-DD'),
      renewal_failed: 0,
      renewal_failed_last_time_at: 0,
      renewal_failed_final_warning_sent_at: 0,
    })

    await sails.helpers.cron.log('updated membership')

    const paymentCardId = membership.payment_subscriptions[0].card_prefix + 'XXXXXX' + membership.payment_subscriptions[0].card_last_4_digits

    await MembershipLog.create({
      membership: membership.id,
      user: membership.user.id,
      client: membership.client.id,
      entry: 'Medlemskab blev fornyet. Der blev trukket ' + currencyDkk(order.total) + ' kr. på betalingskortet ' + paymentCardId + '.',
    })


    // Set system_updated and prepare for invoice.
    await SqlService.setInvoiceId({
      client: order.client,
      order: order.id,
    })

    await Order.update({
      id: order.id,
    }, {
      receipt_token: crypto.randomBytes(32).toString('hex'),
      system_updated: new Date(),
    })


    // Send invoice
    await receipt.send(order.id)

    await Order.update(
      {
        id: order.id,
      }, {
        receipt_sent: new Date(),
      },
    )

    return true


  } else {

    await Order.update({
      id: order.id,
    }, {
      payment_failed: new Date(),
    })

    await PaymentSubscriptionTransaction.update({id: subscriptionTransaction.id}, {
      status: 'failed',
      comment: transactionResponseData.reason,
    })

    const paymentCardId = membership.payment_subscriptions[0].card_prefix + 'XXXXXX' + membership.payment_subscriptions[0].card_last_4_digits

    if (membership.renewal_failed == sails.helpers.clientSettings.find('memberships_failed_payment_number_of_failed_payments_before_cancel')) {
      await Membership.update({
        id: membership.id,
      }, {
        status: 'ended',
        ended_because: 'payment_failed',
        renewal_failed: parseInt(membership.renewal_failed) + 1,
        renewal_failed_last_time_at: new Date().getTime(),
      })

      await MembershipLog.create({
        membership: membership.id,
        user: membership.user.id,
        client: membership.client.id,
        entry: `Fornyelse af medlemskab fejlede for ${parseInt(membership.renewal_failed) + 1}. gang. Der kunne ikke trækkes ${currencyDkk(order.total)} kr. på betalingskortet ${paymentCardId}. Medlemskabet er nu afsluttet.`,
      })

      await sails.helpers.email.customer.membershipRenewalFailedMembershipTerminated(membership.id)

    } else {

      await Membership.update({
        id: membership.id,
      }, {
        renewal_failed: parseInt(membership.renewal_failed) + 1,
        renewal_failed_last_time_at: new Date().getTime(),
      })

      await MembershipLog.create({
        membership: membership.id,
        user: membership.user.id,
        client: membership.client.id,
        entry: `Fornyelse af medlemskab fejlede for ${parseInt(membership.renewal_failed) + 1}. gang. Der kunne ikke trækkes ${currencyDkk(order.total)} kr. på betalingskortet ${paymentCardId}.`,
      })

      await sails.helpers.email.membershipRenewalFailed(membership.id, membership.renewal_failed + 1)

    }


    return false

  }
}
