module.exports = {
  friendlyName: 'Destroy video group',

  exits: {
    forbidden: {
      responseType: 'forbidden',
    },
  },

  fn: async function (inputs, exits) {

    if (!(await sails.helpers.can2('controller.VideoGroups.destroy', this.req))) {
      return exits.forbidden()
    }

    const videoGroupId = this.req.param('id')

    await VideoGroup.replaceCollection(videoGroupId, 'videos').members([])
    await VideoGroup.replaceCollection(videoGroupId, 'membership_types').members([])
    await VideoGroup.replaceCollection(videoGroupId, 'class_pass_types').members([])
    await VideoGroup.replaceCollection(videoGroupId, 'events').members([])

    await VideoGroup.update({id: videoGroupId}, {archived: true})

    return exits.success()
  },
}
