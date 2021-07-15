module.exports = {
  friendlyName: 'Set video information level according to user type',

  inputs: {
    videos: {
      type: 'ref',
      required: true,
      description: 'Can be one video or an array of videos',
    },
    req: {
      type: 'ref',
      required: true,
      description: 'The request object',
    },
  },

  fn: async (inputs, exits) => {

    const videos = _.isArray(inputs.videos) ? inputs.videos : [inputs.videos]

    if (inputs.req.authorizedRequestContext === 'admin') {
      // Don't remove anything
      return exits.success()
    }

    await sails.helpers.populate.videos.hasPublicAccess(videos);

    await Promise.all(_.map(videos, async video => {

      if (video.has_public_access) {
        return;
      }


      if (inputs.req.user && await sails.helpers.video.userHasAccessToVideo(inputs.req.user, video.id)) {
        return
      }

      // User does not have access to this video or there is no user
      if (video.video_provider_data) {
        video.video_provider_data = _.pick(
          video.video_provider_data,
          [
            'name',
            'description',
            'duration',
            'height',
            'width',
            'pictures.sizes',
            'pictures.type',
            'created_time',
            'stats.plays'
          ],
        )
      }

      delete video.video_provider_id

    }))

    return exits.success()

  },

}
