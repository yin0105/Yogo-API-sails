module.exports = {
  friendlyName: 'Get current user',

  inputs: {
    client: {
      type: 'ref',
      required: true,
    },
    accessToken: {
      type: 'string',
      required: false,
    },
  },

  exits: {
    unauthorized: {},
  },

  fn: async (inputs, exits) => {

    const clientId = sails.helpers.util.idOrObjectIdInteger(inputs.client)

    const accessToken = inputs.accessToken || (await sails.helpers.clientSettings.find(clientId, 'vimeo_oauth_access_token', true))

    const user = await sails.helpers.integrations.vimeo.api.request.with({
      method: 'GET',
      endpoint: '/me?fields=uri,name,location,link,resource_key,account',
      accessToken: accessToken,
    })
      .tolerate('unauthorized', e => {
        exits.unauthorized(e.message)
        return null
      })

    if (!user) return

    return exits.success(user)

  },
}
