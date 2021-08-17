const fixtures = require('../../../../fixtures/factory').fixtures
const testClientId = require('../../../../global-test-variables').TEST_CLIENT_ID
const assert = require('assert')

const assertAsyncThrows = require('../../../../utils/assert-async-throws')
const assertAsync = require('../../../../utils/assert-async')

const comparePartialObject = require('../../../../utils/compare-partial-object')
describe('helpers.populate.classes.class-is-fully-booked', async function () {

  let
    yogaClass1,
    yogaClass2,
    yogaClass3,
    allClasses,
    signups

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
      seats: 2,
      class_type: fixtures.classTypeYoga.id,
      date: '2019-05-16',
      start_time: '10:00:00',
    }).fetch()
    yogaClass3 = await Class.create({
      client: testClientId,
      seats: 1,
      class_type: fixtures.classTypeYoga.id,
      date: '2019-05-16',
      start_time: '10:01:00',
    }).fetch()

    signups = await ClassSignup.createEach([
      {
        'class': yogaClass2.id,
        user: fixtures.userAlice.id,
      },
      {
        'class': yogaClass2.id,
        user: fixtures.userBill.id,
      },
    ])

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

    await ClassSignup.destroy({id: _.map(signups, 'id')})
  })


  it('should return an empty array if input is empty', async () => {

    const result = await sails.helpers.populate.classes.classIsFullyBooked([])

    assert(_.isArray(result) && result.length === 0)

  })


  it('should return input array unchanged if input is already populated', async () => {

    const workingCopy = _.map(_.cloneDeep(allClasses), cls => {
      cls.class_is_fully_booked = true
      return cls
    })

    await sails.helpers.populate.classes.classIsFullyBooked(workingCopy)

    assert.deepStrictEqual(
      _.map(workingCopy, 'class_is_fully_booked'),
      [true, true, true],
    )

  })

  it('should return Class.class_is_fully_booked', async () => {
    let workingCopy = _.cloneDeep(allClasses)

    await sails.helpers.populate.classes.classIsFullyBooked(workingCopy)

    comparePartialObject(
      workingCopy,
      [
        {
          class_is_fully_booked: false,
        },
        {
          class_is_fully_booked: true,
        },
        {
          class_is_fully_booked: false,
        },
      ],
    )

  })

})


