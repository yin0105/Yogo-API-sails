const fixtures = require('../../../../fixtures/factory').fixtures
const testClientId = require('../../../../global-test-variables').TEST_CLIENT_ID
const assert = require('assert')


const comparePartialObject = require('../../../../utils/compare-partial-object')


describe('helpers.populate.classes.user-is-signed-up-for-class', async function () {

  let
    class1,
    class2,
    classCancelled1,
    classCancelled2,
    classArchived1,
    classArchived2,
    allClasses,
    signups

  before(async () => {
    class1 = await Class.create({
      client: testClientId,
    }).fetch()
    class2 = await Class.create({
      client: testClientId,
    }).fetch()
    classArchived1 = await Class.create({
      client: testClientId,
      archived: true,
    }).fetch()
    classArchived2 = await Class.create({
      client: testClientId,
      archived: true,
    }).fetch()
    classCancelled1 = await Class.create({
      client: testClientId,
      cancelled: true,
    }).fetch()
    classCancelled2 = await Class.create({
      client: testClientId,
      cancelled: true,
    }).fetch()

    allClasses = [
      class1,
      class2,
      classCancelled1,
      classCancelled2,
      classArchived1,
      classArchived2,
    ]

    signups = await ClassSignup.createEach([
      {
        user: fixtures.userAlice.id,
        'class': class1.id,
      },
      {
        user: fixtures.userAlice.id,
        'class': classArchived1.id,
      },
      {
        user: fixtures.userAlice.id,
        'class': classCancelled1.id,
      },
    ]).fetch()
  })

  after(async () => {
    await ClassSignup.destroy({id: _.map(signups, 'id')})
    await Class.destroy({id: _.map(allClasses, 'id')})
  })


  it('should return an empty array if input is empty', async () => {

    const result = await sails.helpers.populate.classes.userIsSignedUpForClass([], fixtures.userAlice)

    assert(_.isArray(result) && result.length === 0)

  })


  it('should return input array unchanged if input is already populated', async () => {

    const workingCopy = _.cloneDeep(allClasses)

    workingCopy[0].user_is_signed_up_for_class = false

    await sails.helpers.populate.classes.userIsSignedUpForClass(workingCopy, fixtures.userAlice)

    const expectedResult = _.cloneDeep(allClasses)
    expectedResult[0].user_is_signed_up_for_class = false

    assert.deepStrictEqual(
      workingCopy,
      expectedResult,
    )

  })

  it('should return false on all classes if a user is not provided', async () => {
    const classes = _.cloneDeep(allClasses)

    await sails.helpers.populate.classes.userIsSignedUpForClass(classes)

    comparePartialObject(
      classes,
      [
        {user_is_signed_up_for_class: false},
        {user_is_signed_up_for_class: false},
        {user_is_signed_up_for_class: false},
        {user_is_signed_up_for_class: false},
        {user_is_signed_up_for_class: false},
        {user_is_signed_up_for_class: false},
      ]
    )
  })


  it('should populate classes with user_is_signed_up_for_class', async () => {
    const workingCopy = _.cloneDeep(allClasses)

    await sails.helpers.populate.classes.userIsSignedUpForClass(workingCopy, fixtures.userAlice)

    const expectedResult = _.cloneDeep(allClasses)
    expectedResult[0].user_is_signed_up_for_class = true
    expectedResult[0].user_signup_id = signups[0].id

    expectedResult[1].user_is_signed_up_for_class = false
    expectedResult[1].user_signup_id = null

    expectedResult[2].user_is_signed_up_for_class = true
    expectedResult[2].user_signup_id = signups[2].id

    expectedResult[3].user_is_signed_up_for_class = false
    expectedResult[3].user_signup_id = null

    expectedResult[4].user_is_signed_up_for_class = true
    expectedResult[4].user_signup_id = signups[1].id

    expectedResult[5].user_is_signed_up_for_class = false
    expectedResult[5].user_signup_id = null


    assert.deepStrictEqual(
      workingCopy,
      expectedResult,
    )

  })

})


