module.exports = {
  friendlyName: 'Create an order and a new session with Stripe',

  description: 'Creates an order and either a charge session or a recurring session with Stripe. If the total is zero and there are no recurring items, the order is settled and no session created.',

  inputs: {

  },

  exits: {
    forbidden: {
      responseType: 'forbidden',
    },
  },

  fn: async function (inputs, exits) {

    const secretKey = sails.config.paymentProviders.stripe.secretKey
    const stripe = require("stripe")(secretKey);

    if (!await sails.helpers.can2('controller.StripePayments.create-order-and-matching-session-type', this.req)) {
      return exits.forbidden()
    }

    const order = await sails.helpers.order.createFromCart.with({
      user: this.req.user.id,
    })
      .tolerate('membershipTypeArchived', () => {
        return 'VALIDATION_ERROR'
      })
      .tolerate('paymentOptionGoneAway', () => {
        return 'VALIDATION_ERROR'
      })
      .tolerate('classPassTypeArchived', () => {
        return 'VALIDATION_ERROR'
      })
      .tolerate('userIsNotEligibleForCampaign', () => {
        return 'VALIDATION_ERROR'
      })
      .tolerate('eventIsFullyBooked', () => {
        return 'VALIDATION_ERROR'
      })

    if (order === 'VALIDATION_ERROR') {
      exits.success('E_INVALID_CART_ITEM')
    }

    // if (parseFloat(order.total) === 0) {

    //   const orderItems = await OrderItem.find({order: order.id})
    //   const orderHasRecurringPaymentItems = _.find(orderItems, {item_type: 'membership_type'})
    //   if (orderHasRecurringPaymentItems) {

    //     // const recurringSession = await sails.helpers.paymentProvider.stripe.createRecurringSession(this.req.user.id)
    //     return exits.success({
    //       status: 'RECURRING_SESSION_CREATED',
    //       // recurringSession: recurringSession,
    //       order: order
    //     })

    //   } else {

    //     await sails.helpers.order.processPaymentSettled(order)
    //     const processedOrder = await Order.findOne(order.id);
    //     return exits.success({
    //       status: 'ORDER_SETTLED',
    //       order: processedOrder
    //     })

    //   }

    // }

    // const chargeSession = await sails.helpers.paymentProvider.stripe.createChargeSession.with({
    //   order: order
    // })

    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount: order.total,
    //   currency: "usd"
    // });

    const clientSettings = await sails.helpers.clientSettings.find.with({
      keys: ["plan_pay_as_you_grow_yogo_percentage", "payment_service_provider_stripe_account_id"],
      client: this.req.client.id,
      includeSecrets: true,
    })
    console.log("clientSettings = ", clientSettings)
    const yogoPercent = parseFloat(clientSettings["plan_pay_as_you_grow_yogo_percentage"]);
    const accountId = clientSettings["payment_service_provider_stripe_account_id"];
    const feeAmount = parseInt((order.total - order.vat_amount) * 1.25 * yogoPercent);
    const amount = parseInt(order.total * 100)
    console.log("account id = ", accountId)
    console.log("feeAmount = ", feeAmount)
    console.log("amount = ", amount)

    const paymentIntent = await stripe.paymentIntents.create({
      payment_method_types: ['card'],
      amount: amount,
      currency: 'dkk',
      application_fee_amount: feeAmount,
    }, {
      stripeAccount: accountId,
    
    });

    console.log("secret = ", paymentIntent.client_secret)

    return exits.success({
      status: 'CHARGE_SESSION_CREATED',
      clientSecret: paymentIntent.client_secret,
      amount: amount,
      accountId: accountId
      // chargeSession: chargeSession
    })

  },
}
