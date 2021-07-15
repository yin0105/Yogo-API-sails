module.exports = {
  friendlyName: 'Destroy favorite video for user',

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

  fn: async function (inputs, exits) {

    await UserVideoFavorite.destroy({
      user_id: inputs.user,
      video_id: inputs.video,
    });

    return exits.success();

  },

};
