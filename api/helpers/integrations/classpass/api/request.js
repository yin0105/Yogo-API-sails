const API_ROOT = 'https://sandbox-api.classpass.com'

const request = require('request-promise')
var errors = require('request-promise/errors')

module.exports = {
  friendlyName: 'Call the ClassPass API',

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
    const accessToken = inputs.accessToken || (await sails.config.integrations.classpass_com.classpass_com_access_token)

    const requestOptions = {
      method: inputs.method,
      url: API_ROOT + inputs.endpoint,
      headers: {
        'content-type': 'application/json',
        Authorization: accessToken,
      },
      json: true,
      body: inputs.body,
    }

    //console.log('requestOptions:', requestOptions)

    request(requestOptions)
      .then(response => {
        return exits.success(response)
      })
      .catch(e => {
        const errorMessage = 'ClassPass API request failed. Error: ' + e.code + ' - ' + e.message
        console.log(errorMessage)
        return exits.error(new Error(errorMessage))
      })

  },
}
