module.exports = {
  friendlyName: 'HTTP Auth header for calls to Reepay API',

  inputs: {
    client: {
      type: 'ref',
      description: 'The client to authenticate for Reepay API',
      required: true,
    },
  },

  fn: async (inputs, exits) => {

    const clientId = sails.helpers.util.idOrObjectIdInteger(inputs.client)

    let privateKey
    if (sails.config.productionPayments) {
      privateKey = await sails.helpers.clientSettings.find.with({
        client: clientId,
        keys: 'payment_service_provider_reepay_private_api_key',
        includeSecrets: true,
      })
    } else {
      privateKey = sails.config.paymentProviders.reepay.testAccount.privateApiKey
    }

    const basicAuthUsername = privateKey + ':'

    const base64EncodedBasicAuthUsername = (Buffer.from(basicAuthUsername)).toString('base64')

    const authHeader = {
      authorization: 'Basic ' + base64EncodedBasicAuthUsername,
    }

    return exits.success(authHeader)

  },
}
