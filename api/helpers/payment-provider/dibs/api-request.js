const request = require('request-promise')
var errors = require('request-promise/errors')
const qs = require('qs')

module.exports = {
  friendlyName: 'API request',

  description: 'The raw call to the Dibs API. Factored out in its own file, so we can mock it for tests. Should be as simple as possible.',

  inputs: {
    requestBody: {
      type: 'ref',
      description: 'The request body, regular js object.',
      required: true,
    },
  },

  fn: async (inputs, exits) => {

    if (!sails.config.productionPayments) {
      const errorText = 'Aborting call to Dibs API. Production payments not allowed in this environment. Request body: ' + JSON.stringify(inputs.requestBody)
      await sails.helpers.cron.log(errorText)
      return exits.error(new Error(errorText))
    }

    await sails.helpers.cron.log('Running real Dibs apiRequest against ' + sails.config.paymentProviders.dibs.ticketAuthUrl)

    // Docs for request-promise:
    // https://www.npmjs.com/package/request-promise
    //

    request.post(
      sails.config.paymentProviders.dibs.ticketAuthUrl,
      {
        form: inputs.requestBody,
      },
    )
      .then(response => {
        const parsedResponse = qs.parse(response)
        return exits.success(parsedResponse)
      })
      .catch(errors.StatusCodeError, function (reason) {
        const errorMessage = 'Dibs API request failed. Error: ' + reason.statusCode + ' - ' + reason.error.substr(0,1000)
        console.log(errorMessage)
        return exits.error(new Error(errorMessage))
      })
      .catch(errors.RequestError, function (reason) {
        const errorMessage = 'Dibs API request failed. Error: ' + reason.cause.code + ' - ' + reason.cause.message
        console.log(errorMessage)
        return exits.error(new Error(errorMessage))
      })
      .catch(e => {
        const errorMessage = 'Dibs API request failed. Error: ' + e.code + ' - ' + e.message
        console.log(errorMessage)
        return exits.error(new Error(errorMessage))
      })

  },

}
