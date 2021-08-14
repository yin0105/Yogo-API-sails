module.exports = {
  friendlyName: 'Update class',

  fn: async function (inputs, exits) {
    console.log("== updates ");

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
      'livestream_enabled',
      'classpass_com_enabled',
      'classpass_com_all_seats_allowed',
      'classpass_com_number_of_seats_allowed'
    ])

    console.log("classData = ", classData);

    if (classData.room === '') {
      classData.room = null;
    }

    const createdClass = (await Class.update({id: this.req.param('id')}, classData).fetch())[0]

    await sails.helpers.classes.checkIfWaitingListShouldBeApplied(createdClass)

    exits.success(createdClass)

    const resp = await sails.helpers.integrations.classpass.update.with({
      schedule_id: createdClass.id,
      partner_id: createdClass.client
    })

  },
}
