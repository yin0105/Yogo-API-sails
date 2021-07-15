module.exports = async (req, res) => {

  let populateFields = req.query.populate ? _.keyBy(_.intersection(
    req.query.populate,
    [
      'image',
      'teachers',
      'teachers.image',
      'time_slots',
      'signups',
      'signups.user',
      'signups.user.image',
      'signup_count',
      'event_group',
      'event_group.image',
    ]))
    :
    []

  const eventQuery = Event.findOne({id: req.params.id})

  const simplePopulateFields = _.pick(populateFields, ['image', 'time_slots', 'signups', 'teachers'])

  _.each(simplePopulateFields, field => {
    if (field === 'image') {
      eventQuery.populate(field)
    } else {
      eventQuery.populate(field, {archived: false})
    }
  })

  const event = await eventQuery

  if (populateFields.teachers && populateFields['teachers.image']) {
    let images = await Image.find({id: _.map(event.teachers, 'image')})

    images = _.keyBy(images, 'id')

    _.each(event.teachers, teacher => {
      teacher.image = images[teacher.image]
    })
  }

  if (populateFields.signups && populateFields['signups.user']) {
    const userIds = _.map(event.signups, 'user')
    const userQuery = User.find({id: userIds})
    if (populateFields['signups.user.image']) {
      userQuery.populate('image')
    }
    let users = await userQuery
    users = _.keyBy(users, 'id')

    _.each(event.signups, signup => {
      signup.user = users[signup.user]
    })
  }

  if (populateFields.signup_count) {
    if (populateFields.signups) {
      event.signup_count = event.signups.length
    } else {
      const signupsForSignupCount = await EventSignup.find({event: event.id, archived:false})
      event.signup_count = signupsForSignupCount.length
    }
  }

  if (populateFields.event_group && event.event_group) {
    const eventGroupQuery = EventGroup.findOne(event.event_group)
    if (populateFields['event_group.image']) {
      eventGroupQuery.populate('image')
    }
    event.event_group = await eventGroupQuery
  }

  return res.json(event)

}
