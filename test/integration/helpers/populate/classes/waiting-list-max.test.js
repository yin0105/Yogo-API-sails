const testClientId = require('../../../../global-test-variables').TEST_CLIENT_ID
const assert = require('assert')

describe('helpers.populate.classes.waiting-list-max', async function () {

  let
    class1,
    class2,
    class3,
    allClasses

  before(async () => {
    class1 = await Class.create({
      client: testClientId,
      seats: 0
    }).fetch()
    class2 = await Class.create({
      client: testClientId,
      seats: 1
    }).fetch()
    class3 = await Class.create({
      client: testClientId,
      seats: 30
    }).fetch()

    allClasses = [
      class1,
      class2,
      class3
    ]

  })

  after(async () => {
    await Class.destroy({id: _.map(allClasses, 'id')})
  })


  it('should return an empty array if input is empty', async () => {

    const result = await sails.helpers.populate.classes.waitingListMax([])

    assert(_.isArray(result) && result.length === 0)

  })


  it('should return input array unchanged if input is already populated', async () => {

    const workingCopy = _.cloneDeep(allClasses)
    workingCopy[0].waiting_list_max = 7

    await sails.helpers.populate.classes.waitingListMax(workingCopy)

    expect(workingCopy).to.matchPattern(`
     [
       {
         id: ${workingCopy[0].id},
         waiting_list_max: 7,
         ...
       },
       {
         id: ${workingCopy[1].id},
         waiting_list_max: _.isOmitted,
         ...
       },
       {
         id: ${workingCopy[2].id},
         waiting_list_max: _.isOmitted,
         ...
       }
     ]
    `)

  })


  it('should populate classes with waiting_list_max', async () => {
    const workingCopy = _.cloneDeep(allClasses)

    await sails.helpers.populate.classes.waitingListMax(workingCopy)

    expect(workingCopy).to.matchPattern(`
     [
       {
         id: ${workingCopy[0].id},
         waiting_list_max: 0,
         ...
       },
       {
         id: ${workingCopy[1].id},
         waiting_list_max: 2,
         ...
       },
       {
         id: ${workingCopy[2].id},
         waiting_list_max: 20,
         ...
       }
     ]
    `)
  })

})


