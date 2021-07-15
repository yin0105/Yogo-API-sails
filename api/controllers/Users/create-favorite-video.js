module.exports = {
  friendlyName: 'Create favorite video for user',

  inputs: {
    user: {
      type: 'number',
      required: true,
    },
    video: {
      type: 'number',
      required: true,
    },
  },

  exits: {
    badRequest: {
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {

    const user = await User.findOne(inputs.user);
    const video = await Video.findOne({
      id: inputs.video,
      archived: false,
      client: user.client,
    });

    if (!video) {
      return exits.badRequest('Video not found');
    }

    const existingRelation = await UserVideoFavorite.findOne({
      user_id: inputs.user,
      video_id: inputs.video,
    });

    if (existingRelation) {
      return exits.success();
    }

    await UserVideoFavorite.create({
      user_id: inputs.user,
      video_id: inputs.video,
    });

    return exits.success();

  },

};
