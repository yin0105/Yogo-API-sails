const MembershipPauseObjection = require('../../objection-models/MembershipPause');
const currencyDkk = require('../../filters/currency_dkk');

module.exports = {
  frendlyName: 'Collect membership pause fee',

  inputs: {
    membershipPause: {
      type: 'ref',
      required: true,
    },
  },

  fn: async (inputs, exits) => {

    // console.log('collect fee 1');

    const membershipPauseId = await sails.helpers.util.idOrObjectIdInteger(inputs.membershipPause);

    // console.log('collect fee 2')
    // console.log('membershipPauseId:', membershipPauseId);
    const membershipPause = await MembershipPauseObjection.query().findById(membershipPauseId)
      .eager({
        membership: {
          user: true,
          payment_subscriptions: true,
          membership_type: true,
        },
      })
      .modifyEager('membership.payment_subscriptions', qb => qb.where({
        archived: 0,
        status: 'active',
      }));

    // console.log('collect fee 3')

    if (membershipPause.membership.payment_subscriptions.length > 1) {
      throw new Error('moreThanOnePaymentSubscription');
    }

    if (membershipPause.membership.payment_subscriptions.length === 0) {
      return exits.success(false);
    }

    // console.log('collect fee 4')

    if (membershipPause.fee_paid_with_order_id) {
      await sails.helpers.cron.log(
        `Membership pause fee for membership ${membershipPause.id} already paid.`,
        membershipPause.client_id,
      );
      return exits.success(false);
    }

    // console.log('collect fee 5')

    const locale = await sails.helpers.clientSettings.find(membershipPause.client_id, 'locale');
    const i18n = await sails.helpers.i18N.create(locale);

    // console.log('collect fee 6')

    const order = await Order.create({
      client: membershipPause.client_id,
      user: membershipPause.membership.user.id,
      total: membershipPause.fee,
    }).fetch();

    // console.log('collect fee 7')

    await OrderItem.create({
      client: membershipPause.client_id,
      order: order.id,
      item_type: 'membership_pause_fee',
      item_id: membershipPause.id,
      name: i18n.__('orderItem.MembershipPauseFee', membershipPause.membership.membership_type.name),
      count: 1,
      item_price: membershipPause.fee,
      total_price: membershipPause.fee,
    });

    // console.log('collect fee 8')

    const paymentResult = await sails.helpers.order.payWithPaymentSubscription(
      order,
      membershipPause.membership.payment_subscriptions[0],
    );

    // console.log('collect fee 9')

    if (paymentResult.success) {
      await MembershipPause.update(
        {id: membershipPause.id},
        {
          fee_paid_with_order_id: order.id,
        },
      );

      await Order.update({id: order.id}, {system_updated: Date.now()});

      const sendReceipt = await sails.helpers.clientSettings.find(
        membershipPause.client_id,
        'membership_pause_fee_send_receipt_on_email',
      );

      if (sendReceipt) {
        await sails.helpers.email.customer.receipt(order);
        await Order.update({id: order.id}, {receipt_sent: Date.now()});
      }

      const logEntry = i18n.__(
        'membershipLog.MembershipPauseFeeOfXCollected',
        `${currencyDkk(membershipPause.fee)} kr`,
      );

      await sails.helpers.membershipLog.log(membershipPause.membership_id, logEntry);

    }

    return exits.success(paymentResult.success);

  },
};
