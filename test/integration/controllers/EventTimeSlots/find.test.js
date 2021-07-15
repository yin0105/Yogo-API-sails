const supertest = require('supertest')

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID
const fixtures = require('../../../fixtures/factory').fixtures

const compareDbCollection = require('../../../utils/compare-db-collection')
const comparePartialObject = require('../../../utils/compare-partial-object')

const MockDate = require('mockdate')
const moment = require('moment-timezone')

const {authorizeUserCharlie} = require('../../../utils/request-helpers')

describe('controllers.EventTimeSlots.find', () => {

  let
    event1,
    event2,
    event3,
    eventTimeSlots = [],
    eventArchived,
    roomA,
    roomB,
    eventSignups


  before(async () => {

    roomA = await Room.create({
      branch: fixtures.testClientBranchA.id,
    }).fetch()

    roomB = await Room.create({
      branch: fixtures.testClientBranchB.id,
    }).fetch()

    event1 = await Event.create({
      client: testClientId,
      seats: 3,
      room: roomA.id,
      start_date: '2018-01-01',
      teachers: [fixtures.userAlice.id],
      show_in_calendar: false,
      price: 1500
    }).fetch()

    event2 = await Event.create({
      client: testClientId,
      seats: 3,
      room: roomB.id,
      start_date: '2018-01-02',
      teachers: [fixtures.userAlice.id, fixtures.userBill.id],
      show_in_calendar: true,
      price:0
    }).fetch()

    event3 = await Event.create({
      client: testClientId,
      seats: 3,
      room: roomB.id,
      start_date: '2018-01-03',
      teachers: [fixtures.userBill.id],
      show_in_calendar: false,
      price: 0
    }).fetch()

    eventArchived = await Event.create({
      client: testClientId,
      seats: 2,
      archived: true,
      room: roomA.id,
    }).fetch()


    eventTimeSlots = await EventTimeSlot.createEach([
      {
        event: event1.id,
        date: '2018-01-01',
        client: testClientId,
        start_time: '10:00:00',
        end_time: '12:00:00',
      },
      {
        event: event2.id,
        date: '2018-01-02',
        client: testClientId,
        start_time: '10:00:00',
        end_time: '12:00:00',
      },
      {
        event: event3.id,
        date: '2018-01-03',
        client: testClientId,
        start_time: '10:00:00',
        end_time: '12:00:00',
      },
      {
        event: eventArchived.id,
        date: '2018-01-04',
        client: testClientId,
        start_time: '10:00:00',
        end_time: '12:00:00',
      },


      {
        event: event1.id,
        date: '2018-02-01',
        client: testClientId,
        start_time: '10:00:00',
        end_time: '12:00:00',
      },
      {
        event: event2.id,
        date: '2018-02-02',
        client: testClientId,
        start_time: '10:00:00',
        end_time: '12:00:00',
      },
      {
        event: event3.id,
        date: '2018-02-03',
        client: testClientId,
        start_time: '10:00:00',
        end_time: '12:00:00',
      },
      {
        event: eventArchived.id,
        date: '2018-02-04',
        client: testClientId,
        start_time: '10:00:00',
        end_time: '12:00:00',
      },


      {
        event: event1.id,
        date: '2018-03-01',
        client: testClientId,
        start_time: '10:00:00',
        end_time: '12:00:00',
      },
      {
        event: event2.id,
        date: '2018-03-02',
        client: testClientId,
        start_time: '10:00:00',
        end_time: '12:00:00',
      },
      {
        event: event3.id,
        date: '2018-03-03',
        client: testClientId,
        start_time: '10:00:00',
        end_time: '12:00:00',
      },
      {
        event: eventArchived.id,
        date: '2018-03-04',
        client: testClientId,
        start_time: '10:00:00',
        end_time: '12:00:00',
      },
    ]).fetch()

    eventSignups = await EventSignup.createEach([
      {
        event: event1.id,
        user: fixtures.userCharlie.id,
      },
      {
        event: event3.id,
        user: fixtures.userAlice.id,
      },
      {
        event: event3.id,
        user: fixtures.userBill.id,
      },
      {
        event: event3.id,
        user: fixtures.userCharlie.id,
      },
    ])

  })


  after(async () => {
    await Event.replaceCollection(event1.id, 'teachers').members([])
    await Event.replaceCollection(event2.id, 'teachers').members([])
    await Event.replaceCollection(event3.id, 'teachers').members([])
    await EventTimeSlot.destroy({
      id: _.map(eventTimeSlots, 'id'),
    })
    await Event.destroy({
      id: [
        event1.id,
        event2.id,
        event3.id,
        eventArchived.id,
      ],
    })
    await EventSignup.destroy({id: _.map(eventSignups, 'id')})
    await Room.destroy({id: [roomA.id, roomB.id]})
  })


  it('should force query params startDate and endDate (or event)', async () => {

    await supertest(sails.hooks.http.app)
      .get(
        '/event-time-slots' +
        '?client=' + testClientId +
        '&startDate=2018-01-01',
      )
      .expect(400)
      .expect('"Either an event ID or a date range must be specified"')

    await supertest(sails.hooks.http.app)
      .get(
        '/event-time-slots' +
        '?client=' + testClientId +
        '&endDate=2018-04-01',
      )
      .expect(400)
      .expect('"Either an event ID or a date range must be specified"')

  })

  it('should return time slots in time span', async () => {

    const response = await supertest(sails.hooks.http.app)
      .get(
        '/event-time-slots' +
        '?client=' + testClientId +
        '&startDate=2018-02-01' +
        '&endDate=2018-02-28' +
        '&includeEventsNotVisibleInCalendar=1',
      )
      .expect(200)

    const responseEventTimeSlots = JSON.parse(response.text)

    expect(responseEventTimeSlots).to.matchPattern(`
      [
        {
          id: ${eventTimeSlots[4].id},
          ...
        },
        {
          id: ${eventTimeSlots[5].id},
          ...
        },
        {
          id: ${eventTimeSlots[6].id},
          ...
        },
      ]`
    )

  })

  it('should return time slots for specific event if requested', async () => {

    const response = await supertest(sails.hooks.http.app)
      .get(
        '/event-time-slots' +
        '?client=' + testClientId +
        '&includeEventsNotVisibleInCalendar=1' +
        '&event=' + event1.id,
      )
      .expect(200)

    const responseEventTimeSlots = JSON.parse(response.text)

    expect(responseEventTimeSlots).to.matchPattern(`
      [
        {
          id: ${eventTimeSlots[0].id},
          ...
        },
        {
          id: ${eventTimeSlots[4].id},
          ...
        },
        {
          id: ${eventTimeSlots[8].id},
          ...
        },
      ]`
    )

  })


  it('should return time slots for events with a specific teacher if requested', async () => {

    const response = await supertest(sails.hooks.http.app)
      .get(
        '/event-time-slots' +
        '?client=' + testClientId +
        '&startDate=2018-01-01' +
        '&endDate=2018-03-31' +
        '&includeEventsNotVisibleInCalendar=1' +
        '&teacher=' + fixtures.userAlice.id,
      )
      .expect(200)

    const responseEventTimeSlots = JSON.parse(response.text)

    expect(_.sortBy(responseEventTimeSlots, 'date')).to.matchPattern(`
      [
        {
          id: ${eventTimeSlots[0].id},
          ...
        },
        {
          id: ${eventTimeSlots[1].id},
          ...
        },
        {
          id: ${eventTimeSlots[4].id},
          ...
        },
        {
          id: ${eventTimeSlots[5].id},
          ...
        },
        {
          id: ${eventTimeSlots[8].id},
          ...
        },
        {
          id: ${eventTimeSlots[9].id},
          ...
        }
      ]`
    )

  })

  it('should fail if startDate is before 2017', async () => {

    await supertest(sails.hooks.http.app)
      .get(
        '/event-time-slots' +
        '?client=' + testClientId +
        '&startDate=2016-12-31' +
        '&endDate=2017-01-01',
      )
      .expect(400)
      .expect('"startDate must be in 2017 or later"')

  })

  it('should fail if startDate is after endDate', async () => {

    await supertest(sails.hooks.http.app)
      .get(
        '/event-time-slots' +
        '?client=' + testClientId +
        '&startDate=2017-01-02' +
        '&endDate=2017-01-01',
      )
      .expect(400)
      .expect('"endDate must be the same as or after startDate"')

  })

  it('should fail if date range is more than a year', async () => {

    await supertest(sails.hooks.http.app)
      .get(
        '/event-time-slots' +
        '?client=' + testClientId +
        '&startDate=2017-01-01' +
        '&endDate=2018-01-01',
      )
      .expect(400)
      .expect('"Date range can not be longer than one year"')

  })

  it('should return time slots for events in a specific branch if requested', async () => {

    const response = await supertest(sails.hooks.http.app)
      .get(
        '/event-time-slots' +
        '?client=' + testClientId +
        '&startDate=2018-01-01' +
        '&endDate=2018-03-31' +
        '&includeEventsNotVisibleInCalendar=1'+
        '&branch=' + fixtures.testClientBranchA.id,
      )
      .expect(200)

    const responseEventTimeSlots = JSON.parse(response.text)

    compareDbCollection(
      _.sortBy(responseEventTimeSlots, 'date'),
      [
        {
          id: eventTimeSlots[0].id,
        },
        {
          id: eventTimeSlots[4].id,
        },
        {
          id: eventTimeSlots[8].id,
        },
      ],
      'eventTimeSlots',
    )


  })

  it('should return time slots for events in a specific branch intersected with a specific teacher if requested', async () => {

    const response = await supertest(sails.hooks.http.app)
      .get(
        '/event-time-slots' +
        '?client=' + testClientId +
        '&startDate=2018-01-01' +
        '&endDate=2018-03-31' +
        '&includeEventsNotVisibleInCalendar=1' +
        '&branch=' + fixtures.testClientBranchB.id +
        '&teacher=' + fixtures.userAlice.id,
      )
      .expect(200)

    const responseEventTimeSlots = JSON.parse(response.text)

    compareDbCollection(
      _.sortBy(responseEventTimeSlots, 'date'),
      [
        {
          id: eventTimeSlots[1].id,
        },
        {
          id: eventTimeSlots[5].id,
        },
        {
          id: eventTimeSlots[9].id,
        },
      ],
      'eventTimeSlots',
    )
  })

  it('should populate specified fields', async () => {
    const response = await supertest(sails.hooks.http.app)
      .get(
        '/event-time-slots' +
        '?client=' + testClientId +
        '&startDate=2018-01-01' +
        '&endDate=2018-03-31' +
        '&includeEventsNotVisibleInCalendar=1' +
        '&populate[]=event' +
        '&populate[]=event.image' +
        '&populate[]=event.teachers' +
        '&populate[]=event.teachers.image' +
        '&populate[]=event.signups' +
        '&populate[]=event.signups.user' +
        '&populate[]=event.signups.user.image' +
        '&populate[]=event.event_group' +
        '&populate[]=event.signup_count',
      )
      .expect(200)

    const responseEventTimeSlots = JSON.parse(response.text)

    compareDbCollection(
      _.sortBy(responseEventTimeSlots, 'date'),
      [
        {
          id: eventTimeSlots[0].id,
          event: {
            id: event1.id,
            image: null,
            teachers: [
              {
                id: fixtures.userAlice.id,
                image: null
              }
            ],
            signups: [
              {
                user: {
                  id: fixtures.userCharlie.id,
                  image: null
                }
              }
            ],
            event_group: null,
            signup_count: 1
          }
        },
        {
          id: eventTimeSlots[1].id,
        },
        {
          id: eventTimeSlots[2].id,
        },
        {
          id: eventTimeSlots[4].id,
        },
        {
          id: eventTimeSlots[5].id,
        },
        {
          id: eventTimeSlots[6].id,
        },
        {
          id: eventTimeSlots[8].id,
        },
        {
          id: eventTimeSlots[9].id,
        },
        {
          id: eventTimeSlots[10].id,
        },
      ],
      'eventTimeSlots',
    )
  })

  it('should throw if invalid populate fields are specified', async () => {
    await supertest(sails.hooks.http.app)
      .get(
        '/event-time-slots' +
        '?client=' + testClientId +
        '&startDate=2018-01-01' +
        '&endDate=2018-03-31' +
        '&populate[]=event' +
        '&populate[]=event.image' +
        '&populate[]=event.teachers' +
        '&populate[]=event.teachers.image' +
        '&populate[]=event.signupsx' +
        '&populate[]=event.signups.user' +
        '&populate[]=event.signups.user.imagex' +
        '&populate[]=event.event_group' +
        '&populate[]=event.signup_count',
      )
      .expect(400)
      .expect('"The following populate fields are invalid: event.signupsx, event.signups.user.imagex"')

  })

  it('should filter events based on show_in_calendar if onlyEventsVisibleInCalendar is used', async () => {
    const response = await supertest(sails.hooks.http.app)
      .get(
        '/event-time-slots' +
        '?client=' + testClientId +
        '&startDate=2018-01-01' +
        '&endDate=2018-03-31' +
        '&populate[]=event' +
        '&populate[]=event.image' +
        '&populate[]=event.teachers' +
        '&populate[]=event.teachers.image' +
        '&populate[]=event.signups' +
        '&populate[]=event.signups.user' +
        '&populate[]=event.signups.user.image' +
        '&populate[]=event.event_group' +
        '&populate[]=event.signup_count' +
        '&onlyEventsVisibleInCalendar=1',
      )
      .expect(200)


    compareDbCollection(
      _.sortBy(response.body, 'date'),
      [
        {
          id: eventTimeSlots[1].id,
        },
        {
          id: eventTimeSlots[5].id,
        },
        {
          id: eventTimeSlots[9].id,
        },
      ],
      'eventTimeSlots',
    )


  })

  it('should populate signup_count by query if signups are not populated', async () => {
    const response = await supertest(sails.hooks.http.app)
      .get(
        '/event-time-slots' +
        '?client=' + testClientId +
        '&startDate=2018-01-01' +
        '&endDate=2018-03-31' +
        '&includeEventsNotVisibleInCalendar=1' +
        '&populate[]=event' +
        '&populate[]=event.signup_count'
      )
      .expect(200)


    compareDbCollection(
      _.sortBy(response.body, 'date'),
      [
        {
          id: eventTimeSlots[0].id,
          event: {
            signup_count: 1
          }
        },
        {
          id: eventTimeSlots[1].id,
          event: {
            signup_count: 0
          }
        },
        {
          id: eventTimeSlots[2].id,
          event: {
            signup_count: 3
          }
        },
        {
          id: eventTimeSlots[4].id,
          event: {
            signup_count: 1
          }
        },
        {
          id: eventTimeSlots[5].id,
          event: {
            signup_count: 0
          }
        },
        {
          id: eventTimeSlots[6].id,
          event: {
            signup_count: 3
          }
        },
        {
          id: eventTimeSlots[8].id,
          event: {
            signup_count: 1
          }
        },
        {
          id: eventTimeSlots[9].id,
          event: {
            signup_count:0
          }
        },
        {
          id: eventTimeSlots[10].id,
          event: {
            signup_count: 3
          }
        },
      ],
      'eventTimeSlots',
    )


  })

  it('should populate event automatically, if populate event.signup_count is requested', async () => {
    const response = await supertest(sails.hooks.http.app)
      .get(
        '/event-time-slots' +
        '?client=' + testClientId +
        '&startDate=2018-01-01' +
        '&endDate=2018-03-31' +
        '&includeEventsNotVisibleInCalendar=1' +
        '&populate[]=event.signup_count'
      )
      .expect(200)


    compareDbCollection(
      _.sortBy(response.body, 'date'),
      [
        {
          id: eventTimeSlots[0].id,
          event: {
            signup_count: 1
          }
        },
        {
          id: eventTimeSlots[1].id,
          event: {
            signup_count: 0
          }
        },
        {
          id: eventTimeSlots[2].id,
          event: {
            signup_count: 3
          }
        },
        {
          id: eventTimeSlots[4].id,
        },
        {
          id: eventTimeSlots[5].id,
        },
        {
          id: eventTimeSlots[6].id,
        },
        {
          id: eventTimeSlots[8].id,
        },
        {
          id: eventTimeSlots[9].id,
        },
        {
          id: eventTimeSlots[10].id,
        },
      ],
      'eventTimeSlots',
    )


  })

  it('should populate event_accepts_customer_signups', async () => {

    MockDate.set(moment.tz('2018-01-02', 'Europe/Copenhagen'))

    const response = await supertest(sails.hooks.http.app)
      .get(
        '/event-time-slots' +
        '?client=' + testClientId +
        '&startDate=2018-01-01' +
        '&endDate=2018-03-31' +
        '&includeEventsNotVisibleInCalendar=1' +
        '&populate[]=event_accepts_customer_signups'
      )
      .expect(200)


    compareDbCollection(
      _.sortBy(response.body, 'date'),
      [
        {
          id: eventTimeSlots[0].id,
          event: {
            signup_count: 1
          },
          event_is_fully_booked: false,
          event_has_started: true,
          event_accepts_customer_signups: false
        },
        {
          id: eventTimeSlots[1].id,
          event: {
            signup_count: 0
          },
          event_is_fully_booked: false,
          event_has_started: false,
          event_accepts_customer_signups: true
        },
        {
          id: eventTimeSlots[2].id,
          event: {
            signup_count: 3
          },
          event_is_fully_booked: true,
          event_has_started: false,
          event_accepts_customer_signups: false
        },
        {
          id: eventTimeSlots[4].id,
        },
        {
          id: eventTimeSlots[5].id,
        },
        {
          id: eventTimeSlots[6].id,
        },
        {
          id: eventTimeSlots[8].id,
        },
        {
          id: eventTimeSlots[9].id,
        },
        {
          id: eventTimeSlots[10].id,
        },
      ],
      'eventTimeSlots',
    )

  })

  it('should populate user_can_sign_up_for_event', async () => {

    MockDate.set(moment.tz('2018-01-02', 'Europe/Copenhagen'))

    const response = await supertest(sails.hooks.http.app)
      .get(
        '/event-time-slots' +
        '?client=' + testClientId +
        '&startDate=2018-01-01' +
        '&endDate=2018-03-31' +
        '&includeEventsNotVisibleInCalendar=1' +
        '&populate[]=user_can_sign_up_for_event'
      )
      .expect(200)


    compareDbCollection(
      _.sortBy(response.body, 'date'),
      [
        {
          id: eventTimeSlots[0].id,
          event: {
            signup_count: 1
          },
          event_accepts_customer_signups: false,
          user_can_sign_up_for_event: false,
        },
        {
          id: eventTimeSlots[1].id,
          event: {
            signup_count: 0
          },
          event_accepts_customer_signups: true,
          user_can_sign_up_for_event: true,
        },
        {
          id: eventTimeSlots[2].id,
          event: {
            signup_count: 3
          },
          event_accepts_customer_signups: false,
          user_can_sign_up_for_event: false,
        },
        {
          id: eventTimeSlots[4].id,
        },
        {
          id: eventTimeSlots[5].id,
        },
        {
          id: eventTimeSlots[6].id,
        },
        {
          id: eventTimeSlots[8].id,
        },
        {
          id: eventTimeSlots[9].id,
        },
        {
          id: eventTimeSlots[10].id,
        },
      ],
      'eventTimeSlots',
    )

    MockDate.reset()

  })

  it('should populate user_can_sign_up_for_event, looking at existing signups', async () => {

    MockDate.set(moment.tz('2018-01-01', 'Europe/Copenhagen'))

    const response = await supertest(sails.hooks.http.app)
      .get(
        '/event-time-slots' +
        '?client=' + testClientId +
        '&startDate=2018-01-01' +
        '&endDate=2018-03-31' +
        '&includeEventsNotVisibleInCalendar=1' +
        '&populate[]=user_can_sign_up_for_event'
      )
      .use(authorizeUserCharlie())
      .expect(200)


    compareDbCollection(
      _.sortBy(response.body, 'date'),
      [
        {
          id: eventTimeSlots[0].id,
          event: {
            signup_count: 1
          },
          event_accepts_customer_signups: true,
          user_is_signed_up_for_event: true,
          user_can_sign_up_for_event: false,
        },
        {
          id: eventTimeSlots[1].id,
          event: {
            signup_count: 0
          },
          event_accepts_customer_signups: true,
          user_is_signed_up_for_event: false,
          user_can_sign_up_for_event: true,
        },
        {
          id: eventTimeSlots[2].id,
          event: {
            signup_count: 3
          },
          event_accepts_customer_signups: false,
          user_is_signed_up_for_event: true,
          user_can_sign_up_for_event: false,
        },
        {
          id: eventTimeSlots[4].id,
        },
        {
          id: eventTimeSlots[5].id,
        },
        {
          id: eventTimeSlots[6].id,
        },
        {
          id: eventTimeSlots[8].id,
        },
        {
          id: eventTimeSlots[9].id,
        },
        {
          id: eventTimeSlots[10].id,
        },
      ],
      'eventTimeSlots',
    )

    MockDate.reset()

  })

  it('should populate user_is_signed_up_for_event', async () => {

    const response = await supertest(sails.hooks.http.app)
      .get(
        '/event-time-slots' +
        '?client=' + testClientId +
        '&startDate=2018-01-01' +
        '&endDate=2018-03-31' +
        '&includeEventsNotVisibleInCalendar=1' +
        '&populate[]=user_is_signed_up_for_event'
      )
      .use(authorizeUserCharlie())
      .expect(200)


    comparePartialObject(
      _.sortBy(response.body, 'date'),
      [
        {
          id: eventTimeSlots[0].id,
          user_is_signed_up_for_event: true,
        },
        {
          id: eventTimeSlots[1].id,
          user_is_signed_up_for_event: false,
        },
        {
          id: eventTimeSlots[2].id,
          user_is_signed_up_for_event: true,
        },
        {
          id: eventTimeSlots[4].id,
        },
        {
          id: eventTimeSlots[5].id,
        },
        {
          id: eventTimeSlots[6].id,
        },
        {
          id: eventTimeSlots[8].id,
        },
        {
          id: eventTimeSlots[9].id,
        },
        {
          id: eventTimeSlots[10].id,
        },
      ],
      'eventTimeSlots',
    )

  })


  it('should populate user_is_signed_up_for_event:false on all items if no user', async () => {

    const response = await supertest(sails.hooks.http.app)
      .get(
        '/event-time-slots' +
        '?client=' + testClientId +
        '&startDate=2018-01-01' +
        '&endDate=2018-03-31' +
        '&includeEventsNotVisibleInCalendar=1' +
        '&populate[]=user_is_signed_up_for_event'
      )
      .expect(200)


    comparePartialObject(
      _.sortBy(response.body, 'date'),
      [
        {
          id: eventTimeSlots[0].id,
          user_is_signed_up_for_event: false,
        },
        {
          id: eventTimeSlots[1].id,
          user_is_signed_up_for_event: false,
        },
        {
          id: eventTimeSlots[2].id,
          user_is_signed_up_for_event: false,
        },
        {
          id: eventTimeSlots[4].id,
        },
        {
          id: eventTimeSlots[5].id,
        },
        {
          id: eventTimeSlots[6].id,
        },
        {
          id: eventTimeSlots[8].id,
        },
        {
          id: eventTimeSlots[9].id,
        },
        {
          id: eventTimeSlots[10].id,
        },
      ],
      'eventTimeSlots',
    )

  })

  it('should populate event_has_started', async () => {

    MockDate.set(moment.tz('2018-01-02', 'Europe/Copenhagen'))

    const response = await supertest(sails.hooks.http.app)
      .get(
        '/event-time-slots' +
        '?client=' + testClientId +
        '&startDate=2018-01-01' +
        '&endDate=2018-03-31' +
        '&includeEventsNotVisibleInCalendar=1' +
        '&populate[]=event_has_started'
      )
      .expect(200)


    comparePartialObject(
      _.sortBy(response.body, 'date'),
      [
        {
          id: eventTimeSlots[0].id,
          event_has_started: true,
        },
        {
          id: eventTimeSlots[1].id,
          event_has_started: false,
        },
        {
          id: eventTimeSlots[2].id,
          event_has_started: false,
        },
        {
          id: eventTimeSlots[4].id,
        },
        {
          id: eventTimeSlots[5].id,
        },
        {
          id: eventTimeSlots[6].id,
        },
        {
          id: eventTimeSlots[8].id,
        },
        {
          id: eventTimeSlots[9].id,
        },
        {
          id: eventTimeSlots[10].id,
        },
      ],
      'eventTimeSlots',
    )

  })

  it('should populate event_is_fully_booked', async () => {

    const response = await supertest(sails.hooks.http.app)
      .get(
        '/event-time-slots' +
        '?client=' + testClientId +
        '&startDate=2018-01-01' +
        '&endDate=2018-03-31' +
        '&includeEventsNotVisibleInCalendar=1' +
        '&populate[]=event_is_fully_booked'
      )
      .expect(200)


    comparePartialObject(
      _.sortBy(response.body, 'date'),
      [
        {
          id: eventTimeSlots[0].id,
          event_is_fully_booked: false,
        },
        {
          id: eventTimeSlots[1].id,
          event_is_fully_booked: false,
        },
        {
          id: eventTimeSlots[2].id,
          event_is_fully_booked: true,
        },
        {
          id: eventTimeSlots[4].id,
        },
        {
          id: eventTimeSlots[5].id,
        },
        {
          id: eventTimeSlots[6].id,
        },
        {
          id: eventTimeSlots[8].id,
        },
        {
          id: eventTimeSlots[9].id,
        },
        {
          id: eventTimeSlots[10].id,
        },
      ],
      'eventTimeSlots',
    )

  })

  it('should populate user_can_sign_off_from_event', async () => {

    const response = await supertest(sails.hooks.http.app)
      .get(
        '/event-time-slots' +
        '?client=' + testClientId +
        '&startDate=2018-01-01' +
        '&endDate=2018-03-31' +
        '&includeEventsNotVisibleInCalendar=1' +
        '&populate[]=user_can_sign_off_from_event'
      )
      .use(authorizeUserCharlie())
      .expect(200)


    comparePartialObject(
      _.sortBy(response.body, 'date'),
      [
        {
          id: eventTimeSlots[0].id,
          user_can_sign_off_from_event: false,
        },
        {
          id: eventTimeSlots[1].id,
          user_can_sign_off_from_event: false,
        },
        {
          id: eventTimeSlots[2].id,
          user_can_sign_off_from_event: true,
        },
        {
          id: eventTimeSlots[4].id,
        },
        {
          id: eventTimeSlots[5].id,
        },
        {
          id: eventTimeSlots[6].id,
        },
        {
          id: eventTimeSlots[8].id,
        },
        {
          id: eventTimeSlots[9].id,
        },
        {
          id: eventTimeSlots[10].id,
        },
      ],
      'eventTimeSlots',
    )

  })

  it('should populate user_can_sign_off_from_event:false on all items if no user ', async () => {

    const response = await supertest(sails.hooks.http.app)
      .get(
        '/event-time-slots' +
        '?client=' + testClientId +
        '&startDate=2018-01-01' +
        '&endDate=2018-03-31' +
        '&includeEventsNotVisibleInCalendar=1' +
        '&populate[]=user_can_sign_off_from_event'
      )
      .expect(200)


    comparePartialObject(
      _.sortBy(response.body, 'date'),
      [
        {
          id: eventTimeSlots[0].id,
          user_can_sign_off_from_event: false,
        },
        {
          id: eventTimeSlots[1].id,
          user_can_sign_off_from_event: false,
        },
        {
          id: eventTimeSlots[2].id,
          user_can_sign_off_from_event: false,
        },
        {
          id: eventTimeSlots[4].id,
        },
        {
          id: eventTimeSlots[5].id,
        },
        {
          id: eventTimeSlots[6].id,
        },
        {
          id: eventTimeSlots[8].id,
        },
        {
          id: eventTimeSlots[9].id,
        },
        {
          id: eventTimeSlots[10].id,
        },
      ],
      'eventTimeSlots',
    )

  })

})
