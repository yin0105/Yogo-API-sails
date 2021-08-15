const supertest = require('supertest')
const qs = require('qs')


const testClientId = require('../../../../global-test-variables').TEST_CLIENT_ID
const fixtures = require('../../../../fixtures/factory').fixtures
const comparePartialObject = require('../../../../utils/compare-partial-object')


describe('id', () => {

  let
    class1,
    class2,
    class3

  before(async () => {

    class1 = await Class.create({
      client: testClientId,
      class_type: fixtures.classTypeYoga.id,
      date: '2018-05-11',
      start_time: '12:00:00',
      end_time: '14:00:00',
      seats: 20,
      teachers: [fixtures.userBill.id, fixtures.userCharlie.id],
      room: fixtures.testClientRoomA1.id
    }).fetch()

    class2 = await Class.create({
      client: testClientId,
      class_type: fixtures.classTypeDance.id,
      date: '2018-05-16',
      start_time: '14:00:00',
      end_time: '16:00:00',
      teachers: [fixtures.userBill.id],
      seats: 20,
    }).fetch()

    class3 = await Class.create({
      client: testClientId,
      class_type: fixtures.classTypeDance.id,
      date: '2018-05-16',
      start_time: '14:00:00',
      end_time: '16:00:00',
      teachers: [fixtures.userAlice.id],
      seats: 20,
    }).fetch()

  })

  after(async () => {
    await Class.destroy({
      id: [
        class1.id,
        class2.id,
        class3.id
      ],
    })

  })


  it('should return badRequest if neither ids nor date range is specified', async () => {
    let query = qs.stringify({
      client: testClientId,
      startDate: '2018-05-01',
    })

    await supertest(sails.hooks.http.app)
      .get('/classes').query(query).expect(400)
      .expect('"Either class id(s) or date range must be specified"')

  })

  it('should return only classes with the specified ids', async () => {

    let query = qs.stringify({
      client: testClientId,
      id: class1.id
    })

    let response = await supertest(sails.hooks.http.app)
      .get('/classes').query(query).expect(200)


    comparePartialObject(
      response.body.classes,
      [
        {
          id: class1.id
        },
      ],
    )


    query = qs.stringify({
      client: testClientId,
      id: [class1.id, class2.id]
    })

    response = await supertest(sails.hooks.http.app)
      .get('/classes').query(query).expect(200)

    comparePartialObject(
      response.body.classes,
      [
        {
          id: class1.id
        },
        {
          id: class2.id,
        },
      ],
    )

  })

})
