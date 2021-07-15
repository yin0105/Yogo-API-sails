module.exports = {

  friendlyName: 'Restrict video to YOGO',

  exits: {
    forbidden: {
      responseType: 'forbidden',
    },
  },

  fn: async function (inputs, exits) {

    if (!(await sails.helpers.can2('controller.Videos.restrict-to-yogo', this.req))) {
      return exits.forbidden()
    }

    const videoId = this.req.param('id')

    await sails.helpers.video.restrictVimeoVideoToYogo(videoId)

    return exits.success()

  },

}
