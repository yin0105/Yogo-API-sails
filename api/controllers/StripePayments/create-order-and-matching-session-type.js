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

    const clientSettings = await sails.helpers.clientSettings.find.with({
      keys: ["plan_pay_as_you_grow_yogo_percentage", "payment_service_provider_stripe_account_id"],
      client: this.req.client.id,
      includeSecrets: true,
    })
    const yogoPercent = parseFloat(clientSettings["plan_pay_as_you_grow_yogo_percentage"]);
    const accountId = clientSettings["payment_service_provider_stripe_account_id"];
    const amount = parseInt(order.total * 100);
    console.log("order.total = ", order.total);
    console.log("amount = ", amount);

    console.log("order.total = ", order.total);
    const orderItems = await OrderItem.find({order: order.id})
    const orderHasRecurringPaymentItems = _.find(orderItems, {item_type: 'membership_type'})
    
    if (parseFloat(order.total) === 0) {
      
      await sails.helpers.order.processPaymentSettled(order)
      const processedOrder = await Order.findOne(order.id);
      return exits.success({
        status: 'ORDER_SETTLED',
        order: processedOrder
      })

    } else {
       if (orderHasRecurringPaymentItems) {
         
        const recurringSession =  await sails.helpers.paymentProvider.stripe.createRecurringSession.with({
          user: this.req.user,
          amount: amount,
        })
        
        return exits.success({
          status: recurringSession.status,
          clientSecret: recurringSession.clientSecret,
          amount: amount,
          accountId: accountId,
          customerId: recurringSession.customerId,
        });

      } else {
        const feeAmount = parseInt((order.total - order.vat_amount) * 1.25 * yogoPercent);
    
        const paymentIntent = await stripe.paymentIntents.create({
          payment_method_types: ['card'],
          amount: amount,
          currency: 'dkk',
          application_fee_amount: feeAmount,
        }, {
          stripeAccount: accountId,
        
        });
    
        return exits.success({
          status: 'CHARGE_SESSION_CREATED',
          clientSecret: paymentIntent.client_secret,
          amount: amount,
          accountId: accountId
        })
      }
    }


  },
}
