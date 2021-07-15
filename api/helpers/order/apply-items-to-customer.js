module.exports = {
  friendlyName: 'Apply order items to customer',

  inputs: {
    order: {
      type: 'ref',
      required: true,
    },
    paymentMethod: {
      type: 'json',
      required: true,
    },
  },

  fn: async (inputs, exits) => {

    const cronLog = sails.helpers.cron.log

    await cronLog('apply-items-to-customer, inputs:' + JSON.stringify(inputs))

    const orderId = sails.helpers.util.idOrObjectIdInteger(inputs.order)

    const order = await Order.findOne(orderId).populate('order_items')

    await Promise.all(order.order_items.map(
      async orderItem => {
        switch (orderItem.item_type) {
          case 'membership_type':

            const membershipCampaign = orderItem.membership_campaign ?
              await MembershipCampaign.findOne({id: orderItem.membership_campaign}) :
              null

            const discountCodeOrderItem = await OrderItem.findOne({order: order.id, item_type: 'discount_code'})
            const discountCode = discountCodeOrderItem ?
              await DiscountCode.findOne(discountCodeOrderItem.item_id) :
              null

            let membership = await sails.helpers.membershipType.applyToCustomer.with({
              membershipType: orderItem.item_id,
              paymentOption: orderItem.payment_option,
              user: order.user,
              order: order.id,
              membershipCampaign: orderItem.membership_campaign,
              membershipCampaignNumberOfReducedPaymentsLeft: membershipCampaign ? membershipCampaign.number_of_months_at_reduced_price - 1 : 0,
              discountCode: discountCode,
              paymentMethod: inputs.paymentMethod,
            })

            const paymentOption = await MembershipTypePaymentOption.findOne(orderItem.payment_option)
            let logMessage = 'Medlemskab købt af kunden.' +
              ' Betalingsperiode: ' + paymentOption.name + '.'

            if (orderItem.membership_campaign) {
              await sails.helpers.populate.membershipTypePaymentOptions.priceTextAccountingForCampaign([paymentOption])
              logMessage += ' Kampagne: ' + membershipCampaign.name + '. ' + paymentOption.priceTextAccountingForCampaign
            }

            await MembershipLog.log(membership, logMessage)
            break
          case 'class_pass_type':
            const newClassPass = await sails.helpers.classPassType.applyToCustomer(orderItem.item_id, order.user, order.id);
            const locale = await sails.helpers.clientSettings.find(order.client, 'locale');
            const validUntilFormatted = sails.helpers.util.formatDate(newClassPass.valid_until, locale);
            const logEntry = sails.helpers.t('classPassLog.classPassBoughtByCustomerValidUntil', [validUntilFormatted]);
            await sails.helpers.classPassLog.log(newClassPass, logEntry);
            break
          case 'event':
            await sails.helpers.event.signUserUp(orderItem.item_id, order.user)
            break
          case 'gift_card_purchase':
            await sails.helpers.giftCard.prepareOnPaymentComplete(orderItem.item_id, order);
            break;
          case 'gift_card_spend':
            await sails.helpers.giftCard.updateAfterSpending(orderItem.item_id, order);
            break;
        }
      },
    ))

    return exits.success()

  },
}
