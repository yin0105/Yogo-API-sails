const fixtures = require('../../../../fixtures/factory').fixtures
const testClientId = require('../../../../global-test-variables').TEST_CLIENT_ID
const assert = require('assert')

const assertAsyncThrows = require('../../../../utils/assert-async-throws')
const assertAsync = require('../../../../utils/assert-async')

const MockDate = require('mockdate')
const comparePartialObject = require('../../../../utils/compare-partial-object')
const moment = require('moment-timezone')

describe('helpers.populate.classes.class-is-too-far-in-the-future-to-sign-up', async function () {

  let
    yogaClass1,
    yogaClass2,
    allClasses

  beforeEach(async () => {
    await ClientSettings.destroy({});
  })

  before(async () => {
    yogaClass1 = await Class.create({
      client: testClientId,
      seats: 20,
      class_type: fixtures.classTypeYoga.id,
      date: '2019-05-22',
      start_time: '10:00:00',
    }).fetch()
    yogaClass2 = await Class.create({
      client: testClientId,
      seats: 20,
      class_type: fixtures.classTypeYoga.id,
      date: '2019-05-23',
      start_time: '10:00:00',
    }).fetch()


    allClasses = [
      yogaClass1,
      yogaClass2,
    ]

    _.each(allClasses, item => {
        item.class_type_id = item.class_type
      },
    )


  })

  after(async () => {
    await Class.destroy({
      id: [
        yogaClass1.id,
        yogaClass2.id,
      ],
    })

  })


  it('should return an empty array if input is empty', async () => {

    const result = await sails.helpers.populate.classes.classIsTooFarInTheFutureToSignUp([])

    assert(_.isArray(result) && result.length === 0)

  })


  it('should return input array unchanged if input is already populated', async () => {

    const workingCopy = _.map(_.cloneDeep(allClasses), cls => {
      cls.class_is_too_far_in_the_future_to_sign_up = true
      return cls
    })

    await sails.helpers.populate.classes.classIsTooFarInTheFutureToSignUp(workingCopy)

    assert.deepStrictEqual(
      _.map(workingCopy, 'class_is_too_far_in_the_future_to_sign_up'),
      [true, true],
    )

  })

  it('should return Class.class_is_too_far_in_the_future_to_sign_up for default value', async () => {
    let workingCopy = _.cloneDeep(allClasses)

    MockDate.set(moment.tz('2019-04-21 10:00:00', 'Europe/Copenhagen'))

    await sails.helpers.populate.classes.classIsTooFarInTheFutureToSignUp(workingCopy)

    comparePartialObject(
      workingCopy,
      [
        {
          class_is_too_far_in_the_future_to_sign_up: false,
        },
        {
          class_is_too_far_in_the_future_to_sign_up: true,
        },

      ],
    )

  })

  it('should return Class.class_is_too_far_in_the_future_to_sign_up for user-defined value', async () => {

    MockDate.set(moment.tz('2019-04-21 10:00:00', 'Europe/Copenhagen'))

    const record = await ClientSettings.create({
      client: testClientId,
      key: 'customer_can_sign_up_for_class_max_days_before_class',
      value: 60,
    }).fetch()

    let workingCopy = _.cloneDeep(allClasses)

    await sails.helpers.populate.classes.classIsTooFarInTheFutureToSignUp(workingCopy)

    comparePartialObject(
      workingCopy,
      [
        {
          class_is_too_far_in_the_future_to_sign_up: false,
        },
        {
          class_is_too_far_in_the_future_to_sign_up: false,
        },

      ],
    )

    await ClientSettings.update({id: record.id}, {
      value: 2,
    })
    workingCopy = _.cloneDeep(allClasses)

    await sails.helpers.populate.classes.classIsTooFarInTheFutureToSignUp(workingCopy)

    comparePartialObject(
      workingCopy,
      [
        {
          class_is_too_far_in_the_future_to_sign_up: true,
        },
        {
          class_is_too_far_in_the_future_to_sign_up: true,
        },

      ],
    )

    await ClientSettings.destroy({id: record.id})

  })

})


