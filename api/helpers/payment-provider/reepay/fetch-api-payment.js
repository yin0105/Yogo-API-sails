module.exports = {
  friendlyName: 'Fetch API payment',

  description: 'Pulls a payment from a stored credit card',

  inputs: {
    order: {
      type: 'ref',
      description: 'The order that requires payment.',
      required: true,
    },
    paymentSubscription: {
      type: 'ref',
      description: 'The subscription to use for the payment',
      required: true,
    },
  },

  fn: async (inputs, exits) => {

    const cronLog = sails.helpers.cron.log


    const orderId = sails.helpers.util.idOrObjectIdInteger(inputs.order)
    const order = await Order.findOne(orderId).populate('order_items').populate('user')

    const paymentSubscriptionId = sails.helpers.util.idOrObjectIdInteger(inputs.paymentSubscription)
    const paymentSubscription = await PaymentSubscription.findOne(paymentSubscriptionId)

    await sails.helpers.populate.orders.orderText([order])

    const requestBody = {
      handle: orderId,
      amount: order.total * 100,
      currency: 'DKK',
      source: paymentSubscription.payment_provider_subscription_id,
      settle: true,
      order_text: order.order_text,
    }

    await cronLog('About to do Reepay API request with requestBody:' + JSON.stringify(requestBody))

    let response
    try {
      response = await sails.helpers.paymentProvider.reepay.api.request(
        order.client,
        'POST',
        '/charge',
        requestBody,
      )
    } catch (e) {

      await cronLog(e.message)

      throw e
    }

    await cronLog('Reepay API request response:' + JSON.stringify(response))


    if (response.state === 'authorized' || response.state === 'settled') {

      await cronLog('Reepay payment settled for order ' + order.id)

      return exits.success({
        success: true,
        transactionId: response.transaction,
        payType: response.source.card_type,
        cardExpiration: response.source.exp_date.replace('-', '/'),
        maskedCard: response.source.masked_card,
      })

    } else {

      await cronLog('Reepay payment FAILED for order ' + order.id + ' for reason: ' + response.error_state + ', ' + response.error)

      return exits.success({
        success: false,
      })

    }
  },
}
