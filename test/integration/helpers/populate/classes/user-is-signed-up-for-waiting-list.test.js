const fixtures = require('../../../../fixtures/factory').fixtures
const testClientId = require('../../../../global-test-variables').TEST_CLIENT_ID
const assert = require('assert')


describe('helpers.populate.classes.user-is-signed-up-for-waiting-list', async function () {

  let
    class1,
    class2,
    allClasses,
    waitingListSignups

  before(async () => {
    class1 = await Class.create({
      client: testClientId,
    }).fetch()
    class2 = await Class.create({
      client: testClientId,
    }).fetch()

    allClasses = [
      class1,
      class2,
    ]

    waitingListSignups = await ClassSignup.createEach([
      {
        user: fixtures.userAlice.id,
        'class': class1.id,
      },
      {
        user: fixtures.userAlice.id,
        'class': class2.id,
        archived: true
      },
      {
        user: fixtures.userBill.id,
        'class': class2.id
      },
    ]).fetch()
  })

  after(async () => {
    await ClassSignup.destroy({id: _.map(waitingListSignups, 'id')})
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

    expect(classes).to.matchPattern(`
      [
        {
          user_is_signed_up_for_class: false,
          ...
        },
        {
          user_is_signed_up_for_class: false,
          ...
        }
      ]`
    )
  })


  it('should populate classes with user_is_signed_up_for_class', async () => {
    const workingCopy = _.cloneDeep(allClasses)

    await sails.helpers.populate.classes.userIsSignedUpForClass(workingCopy, fixtures.userAlice)

    const expectedResult = _.cloneDeep(allClasses)
    expectedResult[0].user_is_signed_up_for_class = true
    expectedResult[0].user_signup_id = waitingListSignups[0].id

    expectedResult[1].user_is_signed_up_for_class = false
    expectedResult[1].user_signup_id = null

    assert.deepStrictEqual(
      workingCopy,
      expectedResult,
    )

  })

})


