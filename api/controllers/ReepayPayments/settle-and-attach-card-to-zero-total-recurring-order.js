module.exports = {
  friendlyName: 'Settles an invoice with total 0 and which starts a recurring payment.',

  inputs: {
    order: {
      type: 'number',
      required: true,
    },
    paymentMethod: {
      type: 'string',
      required: true
    },
  },

  fn: async function (inputs, exits) {

    if (!await sails.helpers.can2('controller.ReepayPayments.settle-and-attach-card-to-zero-total-recurring-order', this.req)) {
      return exits.forbidden()
    }

    const order = await Order.findOne(inputs.order).populate('order_items')
    console.log('order:',order, parseFloat(order.total))
    if (parseFloat(order.total) !== 0.0) {
      throw new Error('Order total not 0.')
    }

    const orderHasRecurringPaymentItem = !!_.find(order.order_items, {item_type: 'membership_type'})
    if (!orderHasRecurringPaymentItem) {
      throw new Error('Order does not have item with recurring payment.')
    }

    const card = await sails.helpers.paymentProvider.reepay.api.request.with({
      client: order.client,
      method: 'GET',
      endpoint: '/customer/' + order.user + '/payment_method/card/' + inputs.paymentMethod
    })

    if (!card) {
      throw new Error('No card or card does not belong to user.')
    }

    await sails.helpers.order.processPaymentSettled.with({
      order: inputs.order,
      pay_type: card.card_type,
      card_prefix: card.masked_card.substr(0, 6),
      card_last_4_digits: card.masked_card.substr(12, 4),
      card_expiration: card.exp_date.replace('-', '/'),
      payment_service_provider: 'reepay',
      payment_provider_subscription_id: card.id,
    })

    return exits.success()

  },
}
