const moment = require('moment-timezone')

module.exports = {
  friendlyName: 'Apply membership type to customer',

  inputs: {
    membershipType: {
      type: 'ref',
      required: true
    },
    paymentOption: {
      type: 'ref',
      required: true
    },
    user: {
      type: 'ref',
      required: true
    },
    order: {
      type: 'ref',
      required: true
    },
    paidUntil: {
      type: 'string',
      customer: pu => pu.match(/^\d\d\d\d-\d\d-\d\d$/),
      required: false
    },
    membershipCampaign: {
      type: 'ref',
      required: false
    },
    membershipCampaignNumberOfReducedPaymentsLeft: {
      type: 'number',
      required: false
    },
    discountCode: {
      type: 'ref',
      required: false
    },
    paymentMethod: {
      type: 'json',
      required: true
    }
  },

  fn: async (inputs, exits) => {

    const membershipTypeId = sails.helpers.util.idOrObjectIdInteger(inputs.membershipType)

    const userId = sails.helpers.util.idOrObjectIdInteger(inputs.user)

    const user = await User.findOne(userId)

    const paymentOptionId = sails.helpers.util.idOrObjectIdInteger(inputs.paymentOption)

    const paymentOption = await MembershipTypePaymentOption.findOne({
      id: paymentOptionId,
      membership_type: membershipTypeId,
    })
    if (!paymentOption) throw new Error('MembershipType applyToCustomer: PaymentOption not found')


    // If paid_until is not specified, use paymentOption duration to set it

    const paidUntil = inputs.paidUntil ||
      moment.tz('Europe/Copenhagen').startOf('day').add(paymentOption.number_of_months_payment_covers, 'months').format('YYYY-MM-DD')

    const orderId = sails.helpers.util.idOrObjectIdInteger(inputs.order)

    const membershipCampaignId = inputs.membershipCampaign ? sails.helpers.util.idOrObjectIdInteger(inputs.membershipCampaign) : null

    const discountCodeId = inputs.discountCode ? sails.helpers.util.idOrObjectIdInteger(inputs.discountCode) : null

    const membership = await Membership.create({
      client: user.client,
      user: userId,
      order: orderId,
      membership_type: membershipTypeId,
      payment_option: paymentOptionId,
      start_date: moment.tz('Europe/Copenhagen').format('YYYY-MM-DD'),
      paid_until: paidUntil,
      status: 'active',
      membership_campaign: membershipCampaignId,
      membership_campaign_number_of_reduced_payments_left: inputs.membershipCampaignNumberOfReducedPaymentsLeft,
      discount_code: discountCodeId
    }).fetch()

    await PaymentSubscription.create({
      client: user.client,
      membership: membership.id,
      status: 'active',
      ...(_.pick(inputs.paymentMethod, [
        'payment_service_provider',
        'payment_provider_subscription_id',
        'pay_type',
        'card_last_4_digits',
        'card_expiration',
        'card_prefix',
      ])),
      card_nomask: inputs.paymentMethod.card_prefix + 'XXXXXX' + inputs.paymentMethod.card_last_4_digits,
    })

    const membershipType = await MembershipType.findOne(membershipTypeId)

    if (membershipType.send_email_to_customer) {
      await sails.helpers.email.customer.yourNewMembership(membership)
    }

    return exits.success(membership)

  }
}
