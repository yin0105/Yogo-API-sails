const fixtures = require('../../../../fixtures/factory').fixtures
const testClientId = require('../../../../global-test-variables').TEST_CLIENT_ID
const assert = require('assert')

const comparePartialObject = require('../../../../utils/compare-partial-object')
const MockDate = require('mockdate')
const moment = require('moment-timezone')

describe('helpers.populate.classes.user-can-sign-off-from-class', async function () {

  let
    yogaClassNotSignedUp,
    yogaClassSignedUp,
    yogaClassStarted,
    yogaClassCancelled,
    privateClassStartingSoon,
    regularClassStartingSoon,
    allClasses,
    signups

  before(async () => {

    MockDate.set(moment.tz('2019-05-01 12:00:00', 'Europe/Copenhagen'))

    yogaClassNotSignedUp = await Class.create({
      client: testClientId,
      class_type: fixtures.classTypeYoga.id,
      date: '2019-05-15',
      start_time: '12:00:00',
      seats: 20,
    }).fetch()
    yogaClassNotSignedUp.class_type_id = fixtures.classTypeYoga.id

    yogaClassSignedUp = await Class.create({
      client: testClientId,
      class_type: fixtures.classTypeYoga.id,
      date: '2019-05-15',
      start_time: '13:00:00',
      seats: 20,
    }).fetch()
    yogaClassSignedUp.class_type_id = fixtures.classTypeYoga.id

    yogaClassStarted = await Class.create({
      client: testClientId,
      class_type: fixtures.classTypeYoga.id,
      date: '2019-05-01',
      start_time: '11:59:00',
      seats: 20,
    }).fetch()
    yogaClassStarted.class_type_id = fixtures.classTypeYoga.id

    yogaClassCancelled = await Class.create({
      client: testClientId,
      class_type: fixtures.classTypeYoga.id,
      date: '2019-05-15',
      start_time: '15:00:00',
      cancelled: true,
      seats: 20,
    }).fetch()
    yogaClassCancelled.class_type_id = fixtures.classTypeYoga.id

    privateClassStartingSoon = await Class.create({
      client: testClientId,
      class_type: fixtures.classTypeYoga.id,
      date: '2019-05-01',
      start_time: '12:15:00',
      seats: 1,
    }).fetch()
    privateClassStartingSoon.class_type_id = fixtures.classTypeYoga.id

    regularClassStartingSoon = await Class.create({
      client: testClientId,
      class_type: fixtures.classTypeYoga.id,
      date: '2019-05-01',
      start_time: '15:45:00',
      seats: 10,
    }).fetch()
    regularClassStartingSoon.class_type_id = fixtures.classTypeYoga.id

    allClasses = [
      yogaClassNotSignedUp,
      yogaClassSignedUp,
      yogaClassStarted,
      yogaClassCancelled,
      privateClassStartingSoon,
      regularClassStartingSoon,
    ]

    signups = await ClassSignup.createEach([
      {
        'class': yogaClassSignedUp.id,
        user: fixtures.userAlice.id,
      },
      {
        'class': yogaClassStarted.id,
        user: fixtures.userAlice.id,
      },
      {
        'class': yogaClassCancelled.id,
        user: fixtures.userAlice.id,
      },
      {
        'class': privateClassStartingSoon.id,
        user: fixtures.userAlice.id,
      },
    ]).fetch()

  })

  after(async () => {
    await Class.destroy({id: _.map(allClasses, 'id')})

    await ClassSignup.destroy({id: _.map(signups, 'id')})

    MockDate.reset()
  })


  it('should return an empty array if input is empty', async () => {

    const result = await sails.helpers.populate.classes.userCanSignOffFromClass([], fixtures.userAlice)

    assert(_.isArray(result) && result.length === 0)

  })


  it('should return input array unchanged if input is already populated', async () => {

    const classes = _.cloneDeep(allClasses)

    classes[0].user_can_sign_off_from_class = true


    await sails.helpers.populate.classes.userCanSignOffFromClass(classes, fixtures.userAlice)

    const expectedResult = _.cloneDeep(allClasses)

    expectedResult[0].user_can_sign_off_from_class = true

    assert.deepStrictEqual(
      classes,
      expectedResult,
    )

  })

  it('should return false on all items if a user is not provided', async () => {
    const classes = _.cloneDeep(allClasses)

    await sails.helpers.populate.classes.userCanSignOffFromClass(classes)

    comparePartialObject(
      classes,
      [
        {user_can_sign_off_from_class: false},
        {user_can_sign_off_from_class: false},
        {user_can_sign_off_from_class: false},
        {user_can_sign_off_from_class: false},
        {user_can_sign_off_from_class: false},
        {user_can_sign_off_from_class: false},
      ],
    )
  })

  it('should return correct values based on user_is_signed_up_for_class and class_has_started', async () => {
    const classes = [
      {
        user_is_signed_up_for_class: true,
        class_has_started: true,
      },
      {
        user_is_signed_up_for_class: true,
        class_has_started: false,
      },
      {
        user_is_signed_up_for_class: false,
        class_has_started: true,
      },
      {
        user_is_signed_up_for_class: false,
        class_has_started: false,
      },
    ]

    await sails.helpers.populate.classes.userCanSignOffFromClass(classes, fixtures.userAlice)

    assert.deepStrictEqual(
      classes,
      [
        {
          user_is_signed_up_for_class: true,
          class_has_started: true,
          user_can_sign_off_from_class: false,
        },
        {
          user_is_signed_up_for_class: true,
          class_has_started: false,
          user_can_sign_off_from_class: true,
        },
        {
          user_is_signed_up_for_class: false,
          class_has_started: true,
          user_can_sign_off_from_class: false,
        },
        {
          user_is_signed_up_for_class: false,
          class_has_started: false,
          user_can_sign_off_from_class: false,
        },
      ],
    )


  })

  it('should invoke other populating functions (class_has_started, user_is_signed_up_for_class) if values are not available', async () => {

    const classes = _.cloneDeep(allClasses)

    await sails.helpers.populate.classes.userCanSignOffFromClass(classes, fixtures.userAlice)

    const expextedResult = _.cloneDeep(allClasses)

    Object.assign(
      expextedResult[0],
      {
        class_has_started: false,
        user_is_signed_up_for_class: false,
        user_can_sign_off_from_class: false,
        user_signup_id: null,
      },
    )
    Object.assign(
      expextedResult[1],
      {
        class_has_started: false,
        user_is_signed_up_for_class: true,
        user_can_sign_off_from_class: true,
        user_signup_id: signups[0].id,
      },
    )
    Object.assign(
      expextedResult[2],
      {
        class_has_started: true,
        user_is_signed_up_for_class: true,
        user_can_sign_off_from_class: false,
        user_signup_id: signups[1].id,
      },
    )
    Object.assign(
      expextedResult[3],
      {
        class_has_started: false,
        user_is_signed_up_for_class: true,
        user_can_sign_off_from_class: false,
        user_signup_id: signups[2].id,
      },
    )
    Object.assign(
      expextedResult[4],
      {
        class_has_started: false,
        user_is_signed_up_for_class: true,
        user_can_sign_off_from_class: true,
        user_signup_id: signups[3].id,
      },
    )
    Object.assign(
      expextedResult[5],
      {
        class_has_started: false,
        user_is_signed_up_for_class: false,
        user_can_sign_off_from_class: false,
        user_signup_id: null,
      },
    )

    assert.deepStrictEqual(
      classes,
      expextedResult,
    )

  })


})


