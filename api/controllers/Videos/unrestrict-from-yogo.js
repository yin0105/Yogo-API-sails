module.exports = {

  friendlyName: 'Unrestrict video from YOGO',

  exits: {
    forbidden: {
      responseType: 'forbidden',
    },
  },

  fn: async function (inputs, exits) {

    if (!(await sails.helpers.can2('controller.Videos.unrestrict-from-yogo', this.req))) {
      return exits.forbidden()
    }

    const videoId = this.req.param('id')

    await sails.helpers.video.unrestrictVimeoVideoFromYogo(videoId)

    return exits.success()

  },

}
