module.exports = {
  friendlyName: 'Update class',

  fn: async function (inputs, exits) {

    let classData = _.pick(this.req.body, [
      'date',
      'start_time',
      'end_time',
      'class_type',
      'subtitle',
      'teachers',
      'room',
      'seats',
      'studio_attendance_enabled',
      'livestream_enabled'
    ])

    if (classData.room === '') {
      classData.room = null;
    }

    const createdClass = (await Class.update({id: this.req.param('id')}, classData).fetch())[0]

    await sails.helpers.classes.checkIfWaitingListShouldBeApplied(createdClass)

    return exits.success(createdClass)

  },
}
