const VideoObj = require('../../../objection-models/Video');

module.exports = {
  friendlyName: 'Populate has_public_access',

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

    if (typeof inputs.videos[0].has_public_access !== 'undefined') {
      return exits.success()
    }

    const videoIds = _.map(inputs.videos, 'id');

    const videosWithPublicAccess = await VideoObj.query().alias('v')
      .joinRelation('video_groups', {alias: 'vg'})
      .where({
        'vg.archived': 0,
        'vg.public_access': 1
      })
      .andWhere('v.id', 'in', videoIds);

    const videosWithPublicAccessIds = _.map(videosWithPublicAccess, 'id');

    _.each(inputs.videos, (video) => {
      video.has_public_access = _.includes(videosWithPublicAccessIds, video.id);
    })

    return exits.success()

  },
}
