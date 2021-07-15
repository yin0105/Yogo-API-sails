module.exports = {
  friendlyName: 'Unlock Vimeo video, so it can be viewed freely.',

  inputs: {
    video: {
      type: 'ref',
      required: true,
    },
  },

  exits: {
    noAccessToken: {},
    accessDenied: {},
    noVimeoVideo: {},
  },


  fn: async (inputs, exits) => {

    const yogoVideo = await sails.helpers.util.objectFromObjectOrObjectId(inputs.video, Video)

    const clientId = sails.helpers.util.idOrObjectIdInteger(yogoVideo.client_id || yogoVideo.client)

    const accessToken = await sails.helpers.clientSettings.find(clientId, 'vimeo_oauth_access_token', true)

    if (!accessToken) {
      throw 'noAccessToken'
    }

    await sails.helpers.integrations.vimeo.api.request.with({
      method: 'PATCH',
      endpoint: '/videos/' + yogoVideo.video_provider_id,
      accessToken: accessToken,
      body: {
        privacy: {
          view: 'anybody',
          embed: 'public',
        },
      },
    })

    return exits.success()

  },
}
