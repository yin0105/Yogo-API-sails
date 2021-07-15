module.exports = {
  friendlyName: 'Populate has_public_access',

  inputs: {
    videos: {
      type: 'ref',
      required: true,
    },
    user: {
      type: 'ref',
      required: false,
    },
  },

  fn: async (inputs, exits) => {

    if (!inputs.videos.length) {
      return exits.success([]);
    }

    if (typeof inputs.videos[0].is_user_favorite !== 'undefined') {
      return exits.success();
    }

    if (!inputs.user) {
      _.each(
        inputs.videos,
        video => {video.is_user_favorite = false;},
      );
      return exits.success();
    }

    const userId = sails.helpers.util.idOrObjectIdInteger(inputs.user);

    const videoIds = _.map(inputs.videos, 'id');

    const favoriteVideos = await knex({uvf: 'user_video_favorite'})
      .select('video_id')
      .where('user_id', userId)
      .andWhere('video_id', 'in', videoIds);

    const favoriteVideoIds = _.map(favoriteVideos, 'video_id');

    _.each(
      inputs.videos,
      (video) => {
        video.is_user_favorite = _.includes(favoriteVideoIds, video.id);
      },
    );

    return exits.success();

  },
};
