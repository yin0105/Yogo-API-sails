const API_ROOT = 'https://checkout-api.reepay.com/v1'

const request = require('request-promise')
var errors = require('request-promise/errors')

module.exports = {
  friendlyName: 'Call the Reepay Checkout API',

  inputs: {
    client: {
      type: 'ref',
      required: true,
      description: 'The client is needed to find the API key'
    },
    method: {
      type: 'string',
      isIn: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      required: true,
    },
    endpoint: {
      type: 'string',
      required: true,
    },
    body: {
      type: 'json',
      required: false,
    },
  },

  fn: async (inputs, exits) => {

    const httpAuthHeader = await sails.helpers.paymentProvider.reepay.api.httpAuthHeader(inputs.client)

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
