const VIMEO_VIDEO_FIELDS = require('../../../constants/VIMEO_VIDEO_FIELDS')

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

    let nextRequestEndpoint = '/me/videos?per_page=100&fields=' + VIMEO_VIDEO_FIELDS

    const videos = []

    while (nextRequestEndpoint) {
      const response = await sails.helpers.integrations.vimeo.api.request.with({
        method: 'GET',
        endpoint: nextRequestEndpoint,
        accessToken: accessToken,
      })
        .tolerate('unauthorized', e => {
          exits.unauthorized(e.message)
          return null
        })

      if (response === null) return

      videos.push(...response.data)
      nextRequestEndpoint = response.paging.next
    }

    return exits.success(videos)

  },
}
