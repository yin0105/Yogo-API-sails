const API_ROOT = 'https://api.vimeo.com'

const request = require('request-promise')
var errors = require('request-promise/errors')

module.exports = {
  friendlyName: 'Call the Vimeo API',

  inputs: {
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
    accessToken: {
      type: 'string',
      required: false,
      description: 'Needed for accessing private client data'
    },
  },

  exits: {
    unauthorized: {}
  },

  fn: async (inputs, exits) => {

    const httpAuthHeader = await sails.helpers.integrations.vimeo.api.httpAuthHeader(inputs.accessToken)

    const requestOptions = {
      method: inputs.method,
      url: API_ROOT + inputs.endpoint,
      headers: {
        ...httpAuthHeader,
        'content-type': 'application/json',
        accept: 'application/vnd.vimeo.*+json;version=3.4',
      },
      json: true,
      body: inputs.body,
    }

    //console.log('requestOptions:', requestOptions)

    request(requestOptions)
      .then(response => {
        return exits.success(response)
      })
      .catch(errors.StatusCodeError, function (reason) {
        if (reason && reason.error && reason.error.error_code === 8003) {
          return exits.unauthorized('Unauthorized - Vimeo code 8003')
        }
        const errorMessage = 'Vimeo API request failed. Error: ' + reason.statusCode + ' - ' + reason.message.substr(0,1000)
        console.log(errorMessage)
        return exits.error(new Error(errorMessage))
      })
      .catch(errors.RequestError, function (reason) {
        const errorMessage = 'Vimeo API request failed. Error: ' + reason.cause.code + ' - ' + reason.cause.message
        console.log(errorMessage)
        return exits.error(new Error(errorMessage))
      })
      .catch(e => {
        const errorMessage = 'Vimeo API request failed. Error: ' + e.code + ' - ' + e.message
        console.log(errorMessage)
        return exits.error(new Error(errorMessage))
      })

  },
}
