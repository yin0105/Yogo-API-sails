const fixtures = require('../../../../fixtures/factory').fixtures
const testClientId = require('../../../../global-test-variables').TEST_CLIENT_ID
const assert = require('assert')

const comparePartialObject = require('../../../../utils/compare-partial-object')
const MockDate = require('mockdate')
const moment = require('moment-timezone')

describe('helpers.populate.classes.user-can-sign-up-for-class', async function () {

  let
    yogaClass,
    yogaClassSignedUp,
    danceClass,
    yogaClassCancelled,
    allClasses,
    membership,
    signup

  before(async () => {

    MockDate.set(moment.tz('2019-05-01 12:00:00', 'Europe/Copenhagen'))

    yogaClass = await Class.create({
      client: testClientId,
      studio_attendance_enabled: true,
      class_type: fixtures.classTypeYoga.id,
      date: '2019-05-15',
      start_time: '12:00:00',
      seats: 20,
    }).fetch()
    yogaClass.class_type_id = fixtures.classTypeYoga.id

    yogaClassSignedUp = await Class.create({
      client: testClientId,
      studio_attendance_enabled: true,
      class_type: fixtures.classTypeYoga.id,
      date: '2019-05-15',
      start_time: '13:00:00',
      seats: 20,
    }).fetch()
    yogaClassSignedUp.class_type_id = fixtures.classTypeYoga.id

    danceClass = await Class.create({
      client: testClientId,
      studio_attendance_enabled: true,
      class_type: fixtures.classTypeDance.id,
      date: '2019-05-15',
      start_time: '14:00:00',
      seats: 20,
    }).fetch()
    danceClass.class_type_id = fixtures.classTypeDance.id

    yogaClassCancelled = await Class.create({
      client: testClientId,
      studio_attendance_enabled: true,
      class_type: fixtures.classTypeYoga.id,
      date: '2019-05-15',
      start_time: '15:00:00',
      cancelled: true,
      seats: 20,
    }).fetch()
    yogaClassCancelled.class_type_id = fixtures.classTypeYoga.id

    allClasses = [
      yogaClass,
      yogaClassSignedUp,
      danceClass,
      yogaClassCancelled,
    ]

    membership = await Membership.create({
      user: fixtures.userAlice.id,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'active',
      paid_until: '2019-05-01',
      archived: false,
    }).fetch()

    signup = await ClassSignup.create(
      {
        'class': yogaClassSignedUp.id,
        user: fixtures.userAlice.id,
      },
    ).fetch()

  })

  after(async () => {
    await Class.destroy({id: [yogaClass.id, yogaClassSignedUp.id, danceClass.id, yogaClassCancelled.id]})
    await Membership.destroy({id: membership.id})
    await ClassSignup.destroy({id: signup.id})

    MockDate.reset()
  })


  it('should return an empty array if input is empty', async () => {

    const result = await sails.helpers.populate.classes.userCanSignUpForClass([], fixtures.userAlice)

    assert(_.isArray(result) && result.length === 0)

  })


  it('should return input array unchanged if input is already populated', async () => {

    const classes = _.cloneDeep(allClasses)

    classes[0].user_can_sign_up_for_class = true


    await sails.helpers.populate.classes.userCanSignUpForClass(classes, fixtures.userAlice)

    const expectedResult = _.cloneDeep(allClasses)

    expectedResult[0].user_can_sign_up_for_class = true

    assert.deepStrictEqual(
      classes,
      expectedResult,
    )

  })

  it('should return false on all items if a user is not provided', async () => {
    const classes = _.cloneDeep(allClasses)

    await sails.helpers.populate.classes.userCanSignUpForClass(classes)

    comparePartialObject(
      classes,
      [
        {user_can_sign_up_for_class: false},
        {user_can_sign_up_for_class: false},
        {user_can_sign_up_for_class: false},
        {user_can_sign_up_for_class: false},
      ],
    )
  })

  it('should return correct values based on user_has_access_to_class and class_accepts_customer_signups and user_is_signed_up_for_class', async () => {
    const classes = [
      {
        user_has_access_to_class: true,
        class_accepts_customer_signups: true,
        user_is_signed_up_for_class: false,
        user_is_signed_up_for_livestream: false,
      },
      {
        user_has_access_to_class: false,
        class_accepts_customer_signups: true,
        user_is_signed_up_for_class: false,
        user_is_signed_up_for_livestream: false,
      },
      {
        user_has_access_to_class: true,
        class_accepts_customer_signups: false,
        user_is_signed_up_for_class: false,
        user_is_signed_up_for_livestream: false,
      },
      {
        user_has_access_to_class: true,
        class_accepts_customer_signups: true,
        user_is_signed_up_for_class: true,
        user_is_signed_up_for_livestream: false,
      },
      {
        user_has_access_to_class: true,
        class_accepts_customer_signups: true,
        user_is_signed_up_for_class: false,
        user_is_signed_up_for_livestream: true,
      },
    ]

    await sails.helpers.populate.classes.userCanSignUpForClass(classes, fixtures.userAlice)

    assert.deepStrictEqual(
      classes,
      [
        {
          user_has_access_to_class: true,
          class_accepts_customer_signups: true,
          user_is_signed_up_for_class: false,
          user_is_signed_up_for_livestream: false,
          user_can_sign_up_for_class: true,
        },
        {
          user_has_access_to_class: false,
          class_accepts_customer_signups: true,
          user_is_signed_up_for_class: false,
          user_is_signed_up_for_livestream: false,
          user_can_sign_up_for_class: false,
        },
        {
          user_has_access_to_class: true,
          class_accepts_customer_signups: false,
          user_is_signed_up_for_class: false,
          user_is_signed_up_for_livestream: false,
          user_can_sign_up_for_class: false,
        },
        {
          user_has_access_to_class: true,
          class_accepts_customer_signups: true,
          user_is_signed_up_for_class: true,
          user_is_signed_up_for_livestream: false,
          user_can_sign_up_for_class: false,
        },
        {
          user_has_access_to_class: true,
          class_accepts_customer_signups: true,
          user_is_signed_up_for_class: false,
          user_is_signed_up_for_livestream: true,
          user_can_sign_up_for_class: false,
        },
      ],
    )


  })

  it('should invoke other populating functions (user_has_access_to_class, class_accepts_customer_signups and user_is_signed_up_for_class) if values are not available', async () => {

    const classes = _.cloneDeep(allClasses)

    await sails.helpers.populate.classes.userCanSignUpForClass(classes, fixtures.userAlice)

    const expectedResult = _.cloneDeep(allClasses)

    Object.assign(
      expectedResult[0],
      {
        signup_count: 0,
        checkedin_count: 0,
        class_is_fully_booked: false,
        class_has_started: false,
        class_signup_deadline_has_been_exceeded: false,
        class_is_too_far_in_the_future_to_sign_up: false,
        class_is_open: false,
        class_accepts_customer_signups: true,

        user_has_access_to_class: true,
        class_has_started: false,
        class_is_open: false,
        class_is_fully_booked: false,
        class_signup_deadline_has_been_exceeded: false,
        class_is_too_far_in_the_future_to_sign_up: false,
        class_accepts_customer_signups: true,
        user_is_signed_up_for_class: false,
        user_can_sign_up_for_class: true,
        user_signup_id: null,
        user_livestream_signup_id: null,
        user_is_signed_up_for_livestream: false,
      },
    )
    Object.assign(
      expectedResult[1],
      {
        signup_count: 1,
        
        checkedin_count: 0,
        class_is_fully_booked: false,
        class_has_started: false,
        class_signup_deadline_has_been_exceeded: false,
        class_is_too_far_in_the_future_to_sign_up: false,
        class_is_open: false,
        class_accepts_customer_signups: true,

        user_has_access_to_class: true,
        class_has_started: false,
        
        user_is_signed_up_for_class: true,
        user_can_sign_up_for_class: false,
        user_signup_id: signup.id,
        user_livestream_signup_id: null,
        user_is_signed_up_for_livestream: false,
      },
    )
    Object.assign(
      expectedResult[2],
      {
        signup_count: 0,
        checkedin_count: 0,
        class_is_fully_booked: false,
        class_has_started: false,
        class_signup_deadline_has_been_exceeded: false,
        class_is_too_far_in_the_future_to_sign_up: false,
        class_is_open: false,
        class_accepts_customer_signups: true,

        user_has_access_to_class: false,
        class_has_started: false,
        class_is_open: false,
        class_is_fully_booked: false,
        class_signup_deadline_has_been_exceeded: false,
        class_is_too_far_in_the_future_to_sign_up: false,
        class_accepts_customer_signups: true,
        user_is_signed_up_for_class: false,
        user_can_sign_up_for_class: false,
        user_signup_id: null,
        user_livestream_signup_id: null,
        user_is_signed_up_for_livestream: false,
      },
    )
    Object.assign(
      expectedResult[3],
      {
        signup_count: 0,
        checkedin_count: 0,
        class_is_fully_booked: false,
        class_has_started: false,
        class_signup_deadline_has_been_exceeded: false,
        class_is_too_far_in_the_future_to_sign_up: false,
        class_is_open: false,
        class_accepts_customer_signups: false,
        
        user_has_access_to_class: true,
        class_has_started: false,
        class_is_open: false,
        class_is_fully_booked: false,
        class_signup_deadline_has_been_exceeded: false,
        class_is_too_far_in_the_future_to_sign_up: false,
        class_accepts_customer_signups: false,
        user_is_signed_up_for_class: false,
        user_can_sign_up_for_class: false,
        user_signup_id: null,
        user_livestream_signup_id: null,
        user_is_signed_up_for_livestream: false,
      },
    )

    console.log("classes = ", classes);
    console.log("expectedResult = ", expectedResult);

    assert.deepStrictEqual(
      classes,
      expectedResult,
    )

  })


})


