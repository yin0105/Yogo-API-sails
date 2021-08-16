const fixtures = require('../../../../fixtures/factory').fixtures
const testClientId = require('../../../../global-test-variables').TEST_CLIENT_ID
const assert = require('assert')

const comparePartialObject = require('../../../../utils/compare-partial-object')
const MockDate = require('mockdate')

describe('helpers.populate.classes.signup-count', async function () {

  let
    yogaClass1,
    yogaClass2,
    yogaClass3,
    allClasses,
    signups

  before(async () => {

    yogaClass1 = await Class.create({
      client: testClientId,
      class_type: fixtures.classTypeYoga.id,
      date: '2019-05-15',
      start_time: '12:00:00',
      seats: 20,
    }).fetch()

    yogaClass2 = await Class.create({
      client: testClientId,
      class_type: fixtures.classTypeYoga.id,
      date: '2019-05-15',
      start_time: '13:00:00',
      seats: 20,
    }).fetch()

    yogaClass3 = await Class.create({
      client: testClientId,
      class_type: fixtures.classTypeYoga.id,
      date: '2019-05-01',
      start_time: '11:59:00',
      seats: 20,
    }).fetch()

    allClasses = [
      yogaClass1,
      yogaClass2,
      yogaClass3
    ]

    signups = await ClassSignup.createEach([
      {
        'class': yogaClass1.id,
        user: fixtures.userAlice.id,
      },
      {
        'class': yogaClass1.id,
        user: fixtures.userBill.id,
      },
      {
        'class': yogaClass1.id,
        user: fixtures.userCharlie.id,
      },
      {
        'class': yogaClass2.id,
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

    const result = await sails.helpers.populate.classes.signupCount([])

    assert(_.isArray(result) && result.length === 0)

  })


  it('should return input array unchanged if input is already populated', async () => {

    const classes = _.cloneDeep(allClasses)

    classes[0].signup_count = 0
    classes[1].signup_count = 5
    classes[2].signup_count = 10


    const returnedResult = await sails.helpers.populate.classes.signupCount(classes)

    const expectedResult = _.cloneDeep(allClasses)

    expectedResult[0].signup_count = 0
    expectedResult[1].signup_count = 5
    expectedResult[2].signup_count = 10

    assert.deepStrictEqual(
      classes,
      expectedResult,
    )

    assert.deepStrictEqual(
      returnedResult,
      expectedResult,
    )

  })

  it('should return correct values based on number of already populated signups', async () => {
    const classes = _.cloneDeep(allClasses)

    classes[0].signups = [
      {},
      {},
      {},
      {}
    ]
    classes[1].signups = []
    classes[2].signups = [
      {}
    ]

    await sails.helpers.populate.classes.signupCount(classes)

    comparePartialObject(
      classes,
      [
        {
          signup_count: 4,
        },
        {
          signup_count: 0,
        },
        {
          signup_count: 1,
        },
      ],
    )


  })

  it('should return correct values based on counting signups in db', async () => {

    const classes = _.cloneDeep(allClasses)

    await sails.helpers.populate.classes.signupCount(classes)

    comparePartialObject(
      classes,
      [
        {
          signup_count: 3
        },
        {
          signup_count: 1
        },
        {
          signup_count: 0
        }
      ]
    )

  })


})


