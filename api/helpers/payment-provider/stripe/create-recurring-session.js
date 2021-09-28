module.exports = {
  friendlyName: 'Create Stripe charge session',

  inputs: {
    user: {
      type: 'ref',
      required: true,
    },
    amount: {
      type: 'number',
      required: true,
    }
  },

  fn: async (inputs, exits) => {

    const userId = sails.helpers.util.idOrObjectIdInteger(inputs.user)
    const amount = inputs.amount

    const user = await User.findOne(userId)
    const secretKey = sails.config.paymentProviders.stripe.secretKey
    const stripe = require("stripe")(secretKey)
    console.log("secretkey = ", secretKey);
    console.log("amount = ", amount);

    const customer = await stripe.customers.create();
    console.log("customer = ", customer);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'dkk',
      customer: customer.id,    
    });

    console.log("paymentIntent = ", paymentIntent);

    return exits.success({
      status: 'RECURRING_SESSION_CREATED',
      clientSecret: paymentIntent.client_secret,
      customerId: customer.id,
    })


  },
}
