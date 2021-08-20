const fixtures = require('../../../../fixtures/factory').fixtures
const testClientId = require('../../../../global-test-variables').TEST_CLIENT_ID
const assert = require('assert')

const comparePartialObject = require('../../../../utils/compare-partial-object')

describe('helpers.populate.classes.class-is-open', async function () {

  let
    yogaClass1,
    yogaClass2,
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
      seats: 0,
      class_type: fixtures.classTypeYoga.id,
      date: '2019-05-16',
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

    const result = await sails.helpers.populate.classes.classIsOpen([])

    assert(_.isArray(result) && result.length === 0)

  })


  it('should return input array unchanged if input is already populated', async () => {

    const workingCopy = _.map(_.cloneDeep(allClasses), cls => {
      cls.class_is_open = true
      return cls
    })

    await sails.helpers.populate.classes.classIsOpen(workingCopy)

    assert.deepStrictEqual(
      _.map(workingCopy, 'class_is_open'),
      [true, true],
    )

  })

  it ('should return Class.class_is_open', async () => {
    let workingCopy = _.cloneDeep(allClasses)

    await sails.helpers.populate.classes.classIsOpen(workingCopy)

    comparePartialObject(
      workingCopy,
      [
        {
          class_is_open: false,
        },
        {
          class_is_open: true,
        },
      ]
    )

  })

})


