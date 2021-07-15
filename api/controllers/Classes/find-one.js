function getPopulateFields(req) {
  return _.keyBy(_.intersection(
    req.query.populate,
    [
      'room',
      'room.branch',
      'class_type',
      'class_type.image',
      'teachers',
      'teachers.image',
      'class_repeat',
      'signup_count',
      'signups',
      'signups.user',
      'signups.user.image',
      'signups.used_membership',
      'signups.used_membership.real_user_image',
      'capacity_text',
      'ics_url',
    ],
  ))
}

module.exports = {
  friendlyName: 'Find one class',

  inputs: {
    populate: {
      type: 'json',
      description: 'An array of fields to populate',
      required: false
    }
  },

  fn: async function(inputs, exits) {

    let classQuery = Class.findOne(this.req.param('id'))

    let populateFields = getPopulateFields(this.req)

    let simplePopulateFields = _.pick(populateFields, ['room', 'class_type'])
    _.each(simplePopulateFields, (populateField => {
      classQuery.populate(populateField)
    }))

    if (populateFields.teachers) {
      classQuery.populate('teachers', {
        archived: false,
        teacher: true,
      })
    }

    let classItem = await classQuery

    await Class.populateComplexFields([classItem], populateFields, this.req)

    return exits.success(classItem)

  }

}
