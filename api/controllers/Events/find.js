const moment = require('moment')
require('require-sql')

module.exports = async (req, res) => {

  let criteria = {client: req.client.id, archived: false}

  if (req.query.startDate) {
    criteria.start_date = criteria.start_date || {}
    criteria.start_date['>='] = moment(req.query.startDate).format('YYYY-MM-DD')
  }
  if (req.query.endDate) {
    criteria.start_date = criteria.start_date || {}
    criteria.start_date['<='] = moment(req.query.endDate).format('YYYY-MM-DD')
  }

  if (req.query.endOnOrAfterDate) {
    const eventsThatEndOnOrAfterDateWithoutTimeSlots = await Event.find({
      client: req.client.id,
      archived: false,
      use_time_slots: false,
      start_date: {
        '>=': moment(req.query.endOnOrAfterDate).format('YYYY-MM-DD'),
      },
    })
    const eventsThatEndOnOrAfterDateWithTimeSlots = await sails.sendNativeQuery(
      "SELECT e.id FROM `event` e INNER JOIN event_time_slot ets ON e.id = ets.`event` WHERE e.client = $1 AND e.archived = 0 AND e.use_time_slots = 1 AND ets.date >= DATE($2) AND ets.archived = 0 GROUP BY e.id",
      [
        req.client.id,
        moment(req.query.endOnOrAfterDate).format('YYYY-MM-DD'),
      ],
    )

    criteria.id = _.concat(
      _.map(eventsThatEndOnOrAfterDateWithoutTimeSlots, 'id'),
      _.map(eventsThatEndOnOrAfterDateWithTimeSlots.rows, 'id'),
    )

  }

  // TODO: Fix eventGroup overwrites endOnOrAfterDate
  if (req.query.eventGroup) {
    const eventGroup = await EventGroup.findOne(req.query.eventGroup).populate('events');
    criteria.id = _.map(eventGroup.events, 'id')
  }

  let eventsQuery = Event.find({
    where: criteria,
    sort: 'start_date ASC',
  })

  let populateFields = req.query.populate ? _.keyBy(_.intersection(
    req.query.populate,
    [
      'image',
      'teachers',
      'teachers.image',
      'room',
      'room.branch',
      'event_group',
      'time_slots',
      'signups',
      'signup_count',
    ]))
    :
    []


  _.each(_.pick(populateFields, ['image', 'teachers', 'room', 'event_group']), function (field) {
    eventsQuery.populate(field)
  })

  _.each(_.pick(populateFields, ['time_slots', 'signups']), function (field) {
    eventsQuery.populate(field, {archived: false})
  })

  let events = await eventsQuery

  if (!events.length) return res.json([])

  if (populateFields.teachers && populateFields['teachers.image']) {
    let teachers = []
    _.each(events, function (event) {
      teachers = teachers.concat(event.teachers)
    })
    let imageIds = teachers.map(teacher => teacher.image)
    imageIds = _.compact(_.uniq(imageIds))

    let images = await Image.find({id: imageIds})

    images = _.keyBy(images, 'id')

    _.each(events, function (event) {
      _.each(event.teachers, (teacher) => {
        teacher.image = images[teacher.image]
      })
    })

  }

  if (populateFields.signup_count) {
    if (populateFields.signups) {
      _.each(events, event => {
        event.signup_count = event.signups.length
      })
    } else {

      const getSignupCountsSql = require('../../sql/EventsControllerSql/getSignupCounts.sql')

      const rawGetSignupCountsResult = await sails.sendNativeQuery(getSignupCountsSql, [_.map(events, 'id')])

      let signupCounts = rawGetSignupCountsResult.rows

      signupCounts = _.keyBy(signupCounts, 'id')

      _.each(events, event => {
        event.signup_count = signupCounts[event.id].signup_count
      })

    }
  }

  if (populateFields.room && populateFields['room.branch']) {
    let branches = await Branch.find({
      client: events[0].client,
      archived: false
    })
    branches = _.keyBy(branches, 'id')
    _.each(events, event => {
      if (event.room && event.room.branch) {
        event.room.branch = branches[event.room.branch]
      }
    })
  }

  return res.json(events)

}
