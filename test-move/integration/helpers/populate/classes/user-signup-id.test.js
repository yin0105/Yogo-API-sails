const fixtures = require('../../../../fixtures/factory').fixtures
const testClientId = require('../../../../global-test-variables').TEST_CLIENT_ID
const assert = require('assert')

describe('helpers.populate.classes.user-signup-id', async function () {

  let
    class1,
    class2,
    allClasses,
    signups

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

    signups = await ClassSignup.createEach([
      {
        user: fixtures.userAlice.id,
        'class': class1.id,
      },
      {
        user: fixtures.userAlice.id,
        'class': class2.id,
        archived: true
      }
    ]).fetch()
  })

  after(async () => {
    await ClassSignup.destroy({id: _.map(signups, 'id')})
    await Class.destroy({id: _.map(allClasses, 'id')})
  })


  it('should return an empty array if input is empty', async () => {

    const result = await sails.helpers.populate.classes.userSignupId([], fixtures.userAlice)

    assert(_.isArray(result) && result.length === 0)

  })


  it('should return input array unchanged if input is already populated', async () => {

    const workingCopy = _.cloneDeep(allClasses)

    workingCopy[0].user_signup_id = 123

    const expectedResult = _.cloneDeep(workingCopy)

    await sails.helpers.populate.classes.userSignupId(workingCopy, fixtures.userAlice)

    assert.deepStrictEqual(
      workingCopy,
      expectedResult,
    )

  })

  it('should return null on all classes if a user is not provided', async () => {
    const classes = _.cloneDeep(allClasses)

    await sails.helpers.populate.classes.userSignupId(classes)

    expect(classes).to.matchPattern(`
      [
        {user_signup_id: null, ...},
        {user_signup_id: null, ...},
      ]
    `)
  })


  it('should populate classes with user_signup_id', async () => {
    const workingCopy = _.cloneDeep(allClasses)

    await sails.helpers.populate.classes.userSignupId(workingCopy, fixtures.userAlice)

    const expectedResult = _.cloneDeep(allClasses)
    expectedResult[0].user_signup_id = signups[0].id
    expectedResult[1].user_signup_id = null

    assert.deepStrictEqual(
      workingCopy,
      expectedResult,
    )

  })

})


