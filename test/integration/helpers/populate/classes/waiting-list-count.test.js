const fixtures = require('../../../../fixtures/factory').fixtures
const testClientId = require('../../../../global-test-variables').TEST_CLIENT_ID
const assert = require('assert')

describe('helpers.populate.classes.waiting-list-count', async function () {

  let
    class1,
    class2,
    allClasses,
    waitingListSignups

  before(async () => {
    class1 = await Class.create({
      client: testClientId,
      seats: 1,
    }).fetch()
    class2 = await Class.create({
      client: testClientId,
      seats: 1,
    }).fetch()

    allClasses = [
      class1,
      class2,
    ]

    waitingListSignups = await ClassWaitingListSignup.createEach([
      {
        user: fixtures.userAlice.id,
        'class': class1.id,
      },
      {
        user: fixtures.userBill.id,
        'class': class1.id,
      },
      {
        user: fixtures.userAlice.id,
        'class': class2.id,
      },
      {
        user: fixtures.userBill.id,
        'class': class2.id,
        archived: true,
      },
    ]).fetch()
  })

  after(async () => {
    await ClassSignup.destroy({id: _.map(waitingListSignups, 'id')})
    await Class.destroy({id: _.map(allClasses, 'id')})
  })


  it('should return an empty array if input is empty', async () => {

    const result = await sails.helpers.populate.classes.waitingListCount([])

    assert(_.isArray(result) && result.length === 0)

  })


  it('should return input array unchanged if input is already populated', async () => {

    const workingCopy = _.cloneDeep(allClasses)
    workingCopy[0].waiting_list_count = 7

    await sails.helpers.populate.classes.waitingListCount(workingCopy)

    expect(workingCopy).to.matchPattern(`
     [
       {
         id: ${workingCopy[0].id},
         waiting_list_count: 7,
         ...
       },
       {
         id: ${workingCopy[1].id},
         waiting_list_count: _.isOmitted,
         ...
       }
     ]
    `)

  })


  it('should populate classes with waiting_list_count when signups are not populated', async () => {
    const workingCopy = _.cloneDeep(allClasses)

    await sails.helpers.populate.classes.waitingListCount(workingCopy)

    expect(workingCopy).to.matchPattern(`
     [
       {
         id: ${workingCopy[0].id},
         waiting_list_count: 2,
         ...
       },
       {
         id: ${workingCopy[1].id},
         waiting_list_count: 1,
         ...
       }
     ]
    `)
  })

  it('should populate classes with waiting_list_count when signups are populated', async () => {
    const additionalWaitingListSignup = await ClassWaitingListSignup.create({
      'class': class1.id,
      user: fixtures.userCharlie.id,
    })
    const workingCopy = await Class.find({id: [class1.id, class2.id]}).populate('waiting_list_signups', {archived: false})

    await sails.helpers.populate.classes.waitingListCount(workingCopy)

    expect(workingCopy).to.matchPattern(`
     [
       {
         id: ${workingCopy[0].id},
         waiting_list_count: 3,
         ...
       },
       {
         id: ${workingCopy[1].id},
         waiting_list_count: 1,
         ...
       }
     ]
    `)

    await ClassWaitingListSignup.destroy({id: additionalWaitingListSignup})
  })

})


