const fixtures = require('../../../../fixtures/factory').fixtures
const testClientId = require('../../../../global-test-variables').TEST_CLIENT_ID
const assert = require('assert')

const assertAsyncThrows = require('../../../../utils/assert-async-throws')
const assertAsync = require('../../../../utils/assert-async')

const MockDate = require('mockdate')
const comparePartialObject = require('../../../../utils/compare-partial-object')
const moment = require('moment-timezone')

describe('helpers.populate.classes.class-has-started', async function () {

  let
    yogaClass1,
    yogaClass2,
    yogaClass3,
    allClasses

  before(async () => {
    yogaClass1 = await Class.create({
      client: testClientId,
      seats: 20,
      class_type: fixtures.classTypeYoga.id,
      date: '2019-05-15',
      start_time: '10:00:00',
    }).fetch()
    yogaClass2 = await Class.create({
      client: testClientId,
      seats: 20,
      class_type: fixtures.classTypeYoga.id,
      date: '2019-05-16',
      start_time: '10:00:00',
    }).fetch()
    yogaClass3 = await Class.create({
      client: testClientId,
      seats: 20,
      class_type: fixtures.classTypeYoga.id,
      date: '2019-05-16',
      start_time: '10:01:00',
    }).fetch()


    allClasses = [
      yogaClass1,
      yogaClass2,
      yogaClass3,
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
        yogaClass3.id,
      ],
    })

  })


  it('should return an empty array if input is empty', async () => {

    const result = await sails.helpers.populate.classes.classHasStarted([])

    assert(_.isArray(result) && result.length === 0)

  })


  it('should return input array unchanged if input is already populated', async () => {

    const workingCopy = _.map(_.cloneDeep(allClasses), cls => {
      cls.class_has_started = true
      return cls
    })

    await sails.helpers.populate.classes.classHasStarted(workingCopy)

    assert.deepStrictEqual(
      _.map(workingCopy, 'class_has_started'),
      [true, true, true],
    )

  })

  it ('should return Class.class_has_started', async () => {
    let workingCopy = _.cloneDeep(allClasses)

    MockDate.set(moment.tz('2019-05-16 09:59:59', 'Europe/Copenhagen'))

    await sails.helpers.populate.classes.classHasStarted(workingCopy)

    comparePartialObject(
      workingCopy,
      [
        {
          class_has_started: true,
        },
        {
          class_has_started: false,
        },
        {
          class_has_started: false,
        }
      ]
    )


    workingCopy = _.cloneDeep(allClasses)

    MockDate.set(moment.tz('2019-05-16 10:00:00', 'Europe/Copenhagen'))

    await sails.helpers.populate.classes.classHasStarted(workingCopy)

    comparePartialObject(
      workingCopy,
      [
        {
          class_has_started: true,
        },
        {
          class_has_started: true,
        },
        {
          class_has_started: false,
        }
      ]
    )

    workingCopy = _.cloneDeep(allClasses)

    MockDate.set(moment.tz('2019-05-16 10:01:00', 'Europe/Copenhagen'))

    await sails.helpers.populate.classes.classHasStarted(workingCopy)

    comparePartialObject(
      workingCopy,
      [
        {
          class_has_started: true,
        },
        {
          class_has_started: true,
        },
        {
          class_has_started: true,
        }
      ]
    )

  })

})


