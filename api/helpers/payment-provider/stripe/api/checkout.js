const API_ROOT = 'https://api.stripe.com/v1'

const request = require('request-promise')
var errors = require('request-promise/errors')

module.exports = {
  friendlyName: 'Call the Reepay Checkout API',

  inputs: {
    amount: {
      type: 'number',
      required: true,
    },
    fee: {
      type: 'number',
      required: true,
    },
  },

  fn: async (inputs, exits) => {

    const secretKey = sails.config.paymentProviders.stripe.secretKey

    const stripe = require('stripe')(secretKey);

    const paymentIntent = await stripe.paymentIntents.create({
      payment_method_types: ['card'],
      amount: inputs.amount,
      currency: 'usd',
      application_fee_amount: inputs.fee,
    }, {
      stripeAccount: '{{CONNECTED_STRIPE_ACCOUNT_ID}}',

    });

    const httpAuthHeader = await sails.helpers.paymentProvider.stripe.api.httpAuthHeader(inputs.client)

    const requestOptions = {
      method: inputs.method,
      url: API_ROOT + inputs.endpoint,
      headers: {
        ...httpAuthHeader,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      json: true,
      body: inputs.body,
    }

    console.log('requestOptions:', requestOptions)

    request(requestOptions)
      .then(response => {
        return exits.success(response)
      })
      .catch(errors.StatusCodeError, function (reason) {
        console.log
        const errorMessage = 'Reepay Checkout API request failed. Error: ' + reason.statusCode + ' - ' + reason.message.substr(0,1000)
        console.log(errorMessage)
        return exits.error(new Error(errorMessage))
      })
      .catch(errors.RequestError, function (reason) {
        const errorMessage = 'Reepay Checkout API request failed. Error: ' + reason.cause.code + ' - ' + reason.cause.message
        console.log(errorMessage)
        return exits.error(new Error(errorMessage))
      })
      .catch(e => {
        const errorMessage = 'Reepay Checkout API request failed. Error: ' + e.code + ' - ' + e.message
        console.log(errorMessage)
        return exits.error(new Error(errorMessage))
      })

  },
}
