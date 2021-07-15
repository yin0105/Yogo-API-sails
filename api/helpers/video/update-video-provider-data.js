module.exports = {
  friendlyName: 'Update video provider data for all videos',

  inputs: {
    client: {
      type: 'ref',
      required: true,
    },
    video: {
      type: 'ref',
      required: true,
    },
    accessToken: {
      type: 'string',
      required: false,
    },
  },

  exits: {
    noAccessToVimeo: {},
    unauthorized: {},
    wrongClient: {},
  },

  fn: async (inputs, exits) => {

    const clientId = sails.helpers.util.idOrObjectIdInteger(inputs.client)

    const accessToken = inputs.accessToken ? inputs.accessToken : await sails.helpers.clientSettings.find(inputs.client, 'vimeo_oauth_access_token', true)

    if (!accessToken) throw 'noAccessToVimeo'

    const videoId = sails.helpers.util.idOrObjectIdInteger(inputs.video)

    const yogoVideo = await Video.findOne(videoId)

    if (yogoVideo.client != clientId) {
      throw 'wrongClient'
    }

    const vimeoVideo = await sails.helpers.integrations.vimeo.api.request.with({
      method: 'GET',
      endpoint: '/videos/' + yogoVideo.video_provider_id,
      accessToken: accessToken
    })
      .tolerate('unauthorized', e => {
        exits.unauthorized(e.message)
        return null
      })

    if (!vimeoVideo) return

    await Video.update({id: videoId}, {
      video_provider_data: vimeoVideo,
    })

    return exits.success()

  },
}
