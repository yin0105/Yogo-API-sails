module.exports = {
  friendlyName: 'Destroy class',

  exits: {
    classDoesNotExist: {
      responseType: 'badRequest',
      description: 'E_CLASS_DOES_NOT_EXIST',
    },
    classHasBeenDeleted: {
      responseType: 'badRequest',
      description: 'E_CLASS_HAS_BEEN_DELETED',
    },
    classHasSignups: {
      responseType: 'badRequest',
      description: 'E_CLASS_HAS_SIGNUPS',
    },
  },

  fn: async function (inputs, exits) {

    const classItem = await Class.findOne(this.req.param('id'))
      .populate('signups', {archived: false, cancelled_at: 0})

    if (!classItem) {
      throw 'classDoesNotExist'
    }

    if (classItem.archived) {
      throw 'classHasBeenDeleted'
    }

    if (classItem.signups.length && !classItem.cancelled) {
      throw 'classHasSignups'
    }

    await Class.update({id: classItem.id}, {archived: true})

    return exits.success()
  },

}
