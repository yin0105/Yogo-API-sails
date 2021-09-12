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

    const secretKey = sails.config.paymentProviders.stripe.secretKey
    const stripe = require("stripe")(secretKey)

    await sails.helpers.populate.orders.orderText([order])

    const charge = await stripe.charges.create({
      amount: order.total * 100,
      currency: 'dkk',
      source: paymentSubscription.payment_provider_subscription_id,
      description: order.order_text,
    });
    

    await cronLog('Stripe API request response:' + JSON.stringify(charge))


    if (!charge.error) {

      await cronLog('Stripe payment settled for order ' + order.id)

      return exits.success({
        success: true,
        transactionId: response.transaction,
        payType: response.source.card_type,
        cardExpiration: response.source.exp_date.replace('-', '/'),
        maskedCard: response.source.masked_card,
      })

    } else {

      await cronLog('Stripe payment FAILED for order ' + order.id + ' for reason: ' + response.error_state + ', ' + response.error)

      return exits.success({
        success: false,
      })

    }
  },
}
