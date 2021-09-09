module.exports = {
    friendlyName: 'Retrieve Stripe publishableKey',
  
    description: 'Retrieve Stripe publishableKey',
  
    inputs: {
  
    },
  
    exits: {
      forbidden: {
        responseType: 'forbidden',
      },
    },
  
    fn: async function (inputs, exits) {
  
      const publishableKey = sails.config.paymentProviders.stripe.publishableKey
  
      return exits.success( publishableKey )
  
    },
  }
  