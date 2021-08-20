const fixtures = require('../../../../fixtures/factory').fixtures
const testClientId = require('../../../../global-test-variables').TEST_CLIENT_ID
const assert = require('assert')

const assertAsyncThrows = require('../../../../utils/assert-async-throws')
const assertAsync = require('../../../../utils/assert-async')

const MockDate = require('mockdate')
const comparePartialObject = require('../../../../utils/compare-partial-object')
const moment = require('moment-timezone')

describe('helpers.populate.classes.class-signup-deadline-has-been-exceeded', async function () {

  let
    yogaClass1,
    yogaClass2,
    privateClass,
    allClasses

  before(async () => {
    yogaClass1 = await Class.create({
      client: testClientId,
      seats: 20,
      class_type: fixtures.classTypeYoga.id,
      date: '2019-05-16',
      start_time: '10:00:00',
    }).fetch()
    yogaClass2 = await Class.create({
      client: testClientId,
      seats: 20,
      class_type: fixtures.classTypeYoga.id,
      date: '2019-05-16',
      start_time: '12:00:00',
    }).fetch()
    privateClass = await Class.create({
      client: testClientId,
      seats: 1,
      class_type: fixtures.classTypeYoga.id,
      date: '2019-05-16',
      start_time: '14:00:00',
    }).fetch()

    allClasses = [
      yogaClass1,
      yogaClass2,
      privateClass
    ]
  })

  after(async () => {
    await Class.destroy({
      id: [
        yogaClass1.id,
      ],
    })

  })


  it('should return an empty array if input is empty', async () => {

    const result = await sails.helpers.populate.classes.classSignupDeadlineHasBeenExceeded([])

    assert(_.isArray(result) && result.length === 0)

  })


  it('should return input array unchanged if input is already populated', async () => {

    const workingCopy = _.map(_.cloneDeep(allClasses), cls => {
      cls.class_signup_deadline_has_been_exceeded = true
      return cls
    })

    await sails.helpers.populate.classes.classSignupDeadlineHasBeenExceeded(workingCopy)

    assert.deepStrictEqual(
      _.map(workingCopy, 'class_signup_deadline_has_been_exceeded'),
      [true, true, true],
    )

  })

  it ('should return Class.class_signup_deadline_has_been_exceeded', async () => {
    let workingCopy = _.cloneDeep(allClasses)

    MockDate.set(moment.tz('2019-05-16 11:59:59', 'Europe/Copenhagen'))

    await sails.helpers.populate.classes.classSignupDeadlineHasBeenExceeded(workingCopy)

    comparePartialObject(
      workingCopy,
      [
        {
          class_signup_deadline_has_been_exceeded: true,
        },
        {
          class_signup_deadline_has_been_exceeded: false,
        },
        {
          class_signup_deadline_has_been_exceeded: true,
        }
      ]
    )

    MockDate.reset()

  })

})


