module.exports = {
  friendlyName: 'HTTP Auth header for calls to Vimeo API',

  inputs: {
    accessToken: {
      type: 'string',
      required: false
    }
  },

  fn: async (inputs, exits) => {

    if (inputs.accessToken) {
      return exits.success({
        authorization: 'Bearer ' + inputs.accessToken
      })
    }

    // These configs determine which Vimeo app (prod, staging, dev), we are using
    const vimeoAppClientId = sails.config.integrations.vimeo.clientId
    const vimeoAppSecret = sails.config.integrations.vimeo.clientSecret



    const basicAuthUsername = vimeoAppClientId + ':' + vimeoAppSecret

    const base64EncodedBasicAuthUsername = (new Buffer(basicAuthUsername)).toString('base64')

    const authHeader = {
      authorization: 'Basic ' + base64EncodedBasicAuthUsername,
    }

    return exits.success(authHeader)

  },
}
