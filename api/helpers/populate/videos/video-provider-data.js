const VIMEO_VIDEO_FIELDS = require('../../../constants/VIMEO_VIDEO_FIELDS')

module.exports = {
  friendlyName: 'Populate data from video provider',

  inputs: {
    videos: {
      type: 'ref',
      required: true,
    },
  },

  fn: async (inputs, exits) => {

    if (!inputs.videos.length) {
      return exits.success([])
    }

    if (typeof inputs.videos[0].video_provider_data !== 'undefined') {
      return exits.success()
    }

    const clientId = sails.helpers.util.idOrObjectIdInteger(inputs.videos[0].client_id || inputs.videos[0].client)

    const accessToken = await sails.helpers.clientSettings.find(clientId, 'vimeo_oauth_access_token', true)

    if (inputs.videos.length === 1) {

      inputs.videos[0].video_provider_data = await sails.helpers.integrations.vimeo.api.request.with({
        method: 'GET',
        endpoint: '/videos/' + inputs.videos[0].video_provider_id + '?fields=' + VIMEO_VIDEO_FIELDS,
        accessToken: accessToken,
      })

    } else {

      const vimeoVideos = await sails.helpers.integrations.vimeo.getVideosUploadedByCurrentUser(clientId, accessToken)

      _.each(inputs.videos, video => {
        video.video_provider_data = _.find(vimeoVideos, vimeoVideo => vimeoVideo.uri === '/videos/' + video.video_provider_id)
      })

    }


    return exits.success()

  },
}
