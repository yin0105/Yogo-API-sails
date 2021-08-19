const testClientId = require('../../../../global-test-variables').TEST_CLIENT_ID
const assert = require('assert')

const MockDate = require('mockdate')
const moment = require('moment-timezone')

describe('helpers.populate.classes.class-accepts-customer-signups', async function () {


  before(async () => {


  })

  after(async () => {


  })


  it('should return an empty array if input is empty', async () => {

    const result = await sails.helpers.populate.classes.classAcceptsCustomerSignups([])

    assert(_.isArray(result) && result.length === 0)

  })


  it('should return input array unchanged if input is already populated', async () => {

    const classes = [{
      class_accepts_customer_signups: true,
    }]

    await sails.helpers.populate.classes.classAcceptsCustomerSignups(classes)

    assert.deepStrictEqual(
      classes,
      [{
        class_accepts_customer_signups: true,
      }],
    )

  })


  it('should return false for archived classes', async () => {

    const classes = [{
      studio_attendance_enabled: true,
      archived: true,
      seats: 20,
      signup_count: 5,
      client: testClientId,
      date: '2018-05-15',
      start_time: '10:00:00',
    }]

    await sails.helpers.populate.classes.classAcceptsCustomerSignups(classes)

    assert.deepStrictEqual(
      classes,
      [{
        archived: true,
        studio_attendance_enabled: true,
        seats: 20,
        signup_count: 5,
        class_has_started: true,
        class_is_open: false,
        class_is_fully_booked: false,
        class_signup_deadline_has_been_exceeded: true,
        class_is_too_far_in_the_future_to_sign_up: false,
        class_accepts_customer_signups: false,
        client: testClientId,
        date: '2018-05-15',
        start_time: '10:00:00',
      }],
    )

  })

  it('should return false for classes without studio attendance', async () => {

    const classes = [{
      studio_attendance_enabled: false,
      seats: 20,
      signup_count: 5,
      client: testClientId,
      date: '2018-05-15',
      start_time: '10:00:00',
    }]

    await sails.helpers.populate.classes.classAcceptsCustomerSignups(classes)

    assert.deepStrictEqual(
      classes,
      [{
        studio_attendance_enabled: false,
        seats: 20,
        signup_count: 5,
        class_has_started: true,
        class_is_open: false,
        class_is_fully_booked: false,
        class_signup_deadline_has_been_exceeded: true,
        class_is_too_far_in_the_future_to_sign_up: false,
        class_accepts_customer_signups: false,
        client: testClientId,
        date: '2018-05-15',
        start_time: '10:00:00',
      }],
    )

  })

  it('should return false for cancelled classes', async () => {

    const classes = [{
      studio_attendance_enabled: true,
      cancelled: true,
      seats: 20,
      signup_count: 5,
      client: testClientId,
      date: '2018-05-15',
      start_time: '10:00:00',
    }]

    await sails.helpers.populate.classes.classAcceptsCustomerSignups(classes)

    assert.deepStrictEqual(
      classes,
      [{
        studio_attendance_enabled: true,
        cancelled: true,
        seats: 20,
        signup_count: 5,
        class_has_started: true,
        class_is_open: false,
        class_is_fully_booked: false,
        class_signup_deadline_has_been_exceeded: true,
        class_is_too_far_in_the_future_to_sign_up: false,
        class_accepts_customer_signups: false,
        client: testClientId,
        date: '2018-05-15',
        start_time: '10:00:00',
      }],
    )

  })

  it('should return false if class is fully booked', async () => {

    const classes = [{
      studio_attendance_enabled: true,
      seats: 20,
      signup_count: 20,
      client: testClientId,
      date: '2018-05-15',
      start_time: '10:00:00',
    }]

    await sails.helpers.populate.classes.classAcceptsCustomerSignups(classes)

    assert.deepStrictEqual(
      classes,
      [{
        studio_attendance_enabled: true,
        seats: 20,
        signup_count: 20,
        class_has_started: true,
        class_is_open: false,
        class_is_fully_booked: true,
        class_signup_deadline_has_been_exceeded: true,
        class_is_too_far_in_the_future_to_sign_up: false,
        class_accepts_customer_signups: false,
        client: testClientId,
        date: '2018-05-15',
        start_time: '10:00:00',
      }],
    )

  })

  it('should return false if class has started', async () => {

    const classes = [{
      studio_attendance_enabled: true,
      date: '2019-05-15',
      start_time: '12:00:00',
      seats: 20,
      signup_count: 5,
      client: testClientId,
    }]

    MockDate.set(moment.tz('2019-05-15 12:00:00', 'Europe/Copenhagen'))

    await sails.helpers.populate.classes.classAcceptsCustomerSignups(classes)

    assert.deepStrictEqual(
      classes,
      [{
        studio_attendance_enabled: true,
        date: '2019-05-15',
        start_time: '12:00:00',
        seats: 20,
        signup_count: 5,
        class_has_started: true,
        class_is_open: false,
        class_is_fully_booked: false,
        class_signup_deadline_has_been_exceeded: true,
        class_is_too_far_in_the_future_to_sign_up: false,
        class_accepts_customer_signups: false,
        client: testClientId,
      }],
    )

    MockDate.reset()

  })

  it('should return false for private classes if signup deadline is reached', async () => {

    // Default signup deadline for private classes is 24 hours

    const classes = [{
      studio_attendance_enabled: true,
      date: '2019-05-15',
      start_time: '12:00:00',
      seats: 1,
      signup_count: 0,
      client: testClientId,
    }]

    MockDate.set(moment.tz('2019-05-14 12:00:00', 'Europe/Copenhagen'))

    await sails.helpers.populate.classes.classAcceptsCustomerSignups(classes)

    assert.deepStrictEqual(
      classes,
      [{
        studio_attendance_enabled: true,
        date: '2019-05-15',
        start_time: '12:00:00',
        seats: 1,
        signup_count: 0,
        class_has_started: false,
        class_is_open: false,
        class_is_fully_booked: false,
        class_signup_deadline_has_been_exceeded: true,
        class_is_too_far_in_the_future_to_sign_up: false,
        class_accepts_customer_signups: false,
        client: testClientId,
      }],
    )

    MockDate.reset()

  })

  it('should return false if class is too far in the future to sign up', async () => {

    // Default signup deadline for private classes is 24 hours

    const classes = [{
      studio_attendance_enabled: true,
      date: '2019-07-15',
      start_time: '12:00:00',
      seats: 10,
      signup_count: 0,
      client: testClientId,
    }]

    MockDate.set(moment.tz('2019-05-14 12:00:00', 'Europe/Copenhagen'))

    await sails.helpers.populate.classes.classAcceptsCustomerSignups(classes)

    assert.deepStrictEqual(
      classes,
      [{
        studio_attendance_enabled: true,
        date: '2019-07-15',
        start_time: '12:00:00',
        seats: 10,
        signup_count: 0,
        class_has_started: false,
        class_is_open: false,
        class_is_fully_booked: false,
        class_signup_deadline_has_been_exceeded: false,
        class_is_too_far_in_the_future_to_sign_up: true,
        class_accepts_customer_signups: false,
        client: testClientId,
      }],
    )

    MockDate.reset()

  })

  it('should return false if class is open (seats = 0)', async () => {

    // Default signup deadline for private classes is 24 hours

    const classes = [{
      studio_attendance_enabled: true,
      date: '2019-05-15',
      start_time: '12:00:00',
      seats: 0,
      signup_count: 0,
      client: testClientId,
    }]

    MockDate.set(moment.tz('2019-05-14 12:00:00', 'Europe/Copenhagen'))

    await sails.helpers.populate.classes.classAcceptsCustomerSignups(classes)

    assert.deepStrictEqual(
      classes,
      [{
        studio_attendance_enabled: true,
        date: '2019-05-15',
        start_time: '12:00:00',
        seats: 0,
        signup_count: 0,
        class_is_open: true,
        class_has_started: false,
        class_is_fully_booked: false,
        class_signup_deadline_has_been_exceeded: false,
        class_is_too_far_in_the_future_to_sign_up: false,
        class_accepts_customer_signups: false,
        client: testClientId,
      }],
    )

    MockDate.reset()

  })


  it('should return true if all criterias are met', async () => {

    // Default signup deadline for private classes is 24 hours

    const classes = [{
      studio_attendance_enabled: true,
      date: '2019-05-15',
      start_time: '12:00:00',
      seats: 20,
      signup_count: 5,
      client: testClientId,
    }]

    MockDate.set(moment.tz('2019-05-15 11:59:00', 'Europe/Copenhagen'))

    await sails.helpers.populate.classes.classAcceptsCustomerSignups(classes)

    assert.deepStrictEqual(
      classes,
      [{
        studio_attendance_enabled: true,
        date: '2019-05-15',
        start_time: '12:00:00',
        seats: 20,
        signup_count: 5,
        class_has_started: false,
        class_is_open: false,
        class_is_fully_booked: false,
        class_signup_deadline_has_been_exceeded: false,
        class_is_too_far_in_the_future_to_sign_up: false,
        class_accepts_customer_signups: true,
        client: testClientId,
      }],
    )

    MockDate.reset()

  })

  it('should return true for private classes if all criterias are met and deadline is not reached', async () => {

    // Default signup deadline for private classes is 24 hours

    const classes = [{
      studio_attendance_enabled: true,
      date: '2019-05-15',
      start_time: '12:00:00',
      seats: 1,
      signup_count: 0,
      client: testClientId,
    }]

    MockDate.set(moment.tz('2019-05-14 11:59:00', 'Europe/Copenhagen'))

    await sails.helpers.populate.classes.classAcceptsCustomerSignups(classes)

    assert.deepStrictEqual(
      classes,
      [{
        studio_attendance_enabled: true,
        date: '2019-05-15',
        start_time: '12:00:00',
        seats: 1,
        signup_count: 0,
        class_has_started: false,
        class_is_open: false,
        class_is_fully_booked: false,
        class_signup_deadline_has_been_exceeded: false,
        class_is_too_far_in_the_future_to_sign_up: false,
        class_accepts_customer_signups: true,
        client: testClientId,
      }],
    )

    MockDate.reset()

  })


})


