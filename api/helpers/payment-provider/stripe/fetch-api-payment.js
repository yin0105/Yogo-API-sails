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
    console.log("order = ",order);

    const paymentSubscriptionId = sails.helpers.util.idOrObjectIdInteger(inputs.paymentSubscription)
    const paymentSubscription = await PaymentSubscription.findOne(paymentSubscriptionId)
    console.log("paymentSubscription = ",paymentSubscription);

    const secretKey = sails.config.paymentProviders.stripe.secretKey
    const stripe = require("stripe")(secretKey)
    console.log("secretkey = ", secretKey);

    await sails.helpers.populate.orders.orderText([order])

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: order.total * 100,
        currency: 'dkk',
        customer: paymentSubscription.card_nomask,
        payment_method: paymentSubscription.payment_provider_subscription_id,
        off_session: true,
        confirm: true,
      });
  
      console.log("paymentIntent = ", paymentIntent); 
      
      return exits.success({
        success: true,
        transactionId: paymentIntent.id,
        payType: 'AUTOMATIC',
        cardExpiration: '',
        maskedCard: '0000000000000000',
      })

    } catch (err) {

      console.log('Error code is: ', err.code);
      await cronLog('Error code is: ', err.code);

      const paymentIntentRetrieved = await stripe.paymentIntents.retrieve(err.raw.payment_intent.id);

      console.log('PI retrieved: ', paymentIntentRetrieved.id);
      await cronLog('PI retrieved: ', paymentIntentRetrieved.id);

      return exits.success({
        success: false,
      })
    
    }

    // await cronLog('Stripe API request response:' + JSON.stringify(charge))


    // if (!charge.error) {

    //   await cronLog('Stripe payment settled for order ' + order.id)

    //   return exits.success({
    //     success: true,
    //     transactionId: response.transaction,
    //     payType: response.source.card_type,
    //     cardExpiration: response.source.exp_date.replace('-', '/'),
    //     maskedCard: response.source.masked_card,
    //   })

    // } else {

    //   await cronLog('Stripe payment FAILED for order ' + order.id + ' for reason: ' + response.error_state + ', ' + response.error)

    //   return exits.success({
    //     success: false,
    //   })

    // }
  },
}
