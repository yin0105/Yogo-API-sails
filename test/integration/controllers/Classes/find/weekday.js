const supertest = require('supertest')
const qs = require('qs')

const testClientId = require('../../../../global-test-variables').TEST_CLIENT_ID
const fixtures = require('../../../../fixtures/factory').fixtures

describe('weekday', () => {

  let
    class1,
    class2,
    class3

  before(async () => {


    class1 = await Class.create({
      client: testClientId,
      class_type: fixtures.classTypeYoga.id,
      date: '2020-08-24', // Monday
      start_time: '12:00:00',
      end_time: '14:00:00',
      seats: 20,
      teachers: [fixtures.userBill.id, fixtures.userCharlie.id],
      room: fixtures.testClientRoomA1.id
    }).fetch()


    class2 = await Class.create({
      client: testClientId,
      class_type: fixtures.classTypeYoga.id,
      date: '2020-08-24', // Monday
      start_time: '14:00:00',
      end_time: '16:00:00',
      teachers: [fixtures.userBill.id],
      seats: 20,
    }).fetch()

    class3 = await Class.create({
      client: testClientId,
      class_type: fixtures.classTypeYoga.id,
      date: '2020-08-26', // Wednesday
      start_time: '14:00:00',
      end_time: '16:00:00',
      teachers: [fixtures.userAlice.id],
      seats: 20,
      room: fixtures.testClientRoomB1.id
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


  it('should return only classes on the specified weekday', async () => {

    let query = qs.stringify({
      client: testClientId,
      startDate: '2020-05-01',
      endDate: '2020-09-01',
      weekday: 0
    })

    let response = await supertest(sails.hooks.http.app)
      .get('/classes').query(query).expect(200)

    response.body.classes.sort((a, b) => {
      return a.id > b.id ? 1 : -1;
    })

    expect(response.body.classes).to.matchPattern(`
      [
        {
          id: ${class1.id},
          ...
        },
        {
          id: ${class2.id},
          ...
        },
      ]`
    )


    query = qs.stringify({
      client: testClientId,
      startDate: '2020-05-01',
      endDate: '2020-09-01',
      weekday: 1
    })

    response = await supertest(sails.hooks.http.app)
      .get('/classes').query(query).expect(200)

    expect(response.body.classes).to.matchPattern([])

    query = qs.stringify({
      client: testClientId,
      startDate: '2020-05-01',
      endDate: '2020-09-01',
      weekday: 2
    })

    response = await supertest(sails.hooks.http.app)
      .get('/classes').query(query).expect(200)

    expect(response.body.classes).to.matchPattern(`
      [
        {
          id: ${class3.id},
          ...
        }
      ]`
    )

  })

})
