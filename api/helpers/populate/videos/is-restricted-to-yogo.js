module.exports = {
  friendlyName: 'Populate is_restricted_to_yogo',

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

    if (typeof inputs.videos[0].is_restricted_to_yogo !== 'undefined') {
      return exits.success()
    }

    await sails.helpers.populate.videos.videoProviderData(inputs.videos)

    _.each(inputs.videos, video => {
      video.is_restricted_to_yogo =
        _.includes(['disable', 'nobody'], video.video_provider_data.privacy.view) &&
        video.video_provider_data.privacy.embed === 'whitelist' &&
        video.video_provider_data.embed.buttons.share === false &&
        video.video_provider_data.embed.buttons.watchlater === false &&
        video.video_provider_data.embed.buttons.like === false &&
        video.video_provider_data.embed.buttons.embed === false &&
        video.video_provider_data.embed.logos.vimeo === false
    })

    return exits.success()

  },
}
