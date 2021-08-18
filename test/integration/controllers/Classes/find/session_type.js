const supertest = require('supertest')
const qs = require('qs')

const testClientId = require('../../../../global-test-variables').TEST_CLIENT_ID
const fixtures = require('../../../../fixtures/factory').fixtures
const comparePartialObject = require('../../../../utils/compare-partial-object')

describe('session_type', () => {

  let
    class1Private,
    class2Regular,
    class3Open

  before(async () => {


    class1Private = await Class.create({
      client: testClientId,
      class_type: fixtures.classTypeYoga.id,
      date: '2018-05-11',
      start_time: '12:00:00',
      end_time: '14:00:00',
      seats: 1,
      teachers: [fixtures.userBill.id, fixtures.userCharlie.id],
      room: fixtures.testClientRoomA1.id
    }).fetch()


    class2Regular = await Class.create({
      client: testClientId,
      class_type: fixtures.classTypeDance.id,
      date: '2018-05-16',
      start_time: '14:00:00',
      end_time: '16:00:00',
      teachers: [fixtures.userBill.id],
      seats: 20,
      room: fixtures.testClientRoomA1.id
    }).fetch()

    class3Open = await Class.create({
      client: testClientId,
      class_type: fixtures.classTypeYoga.id,
      date: '2018-05-17',
      start_time: '14:00:00',
      end_time: '16:00:00',
      teachers: [fixtures.userBill.id],
      seats: 0,
      room: fixtures.testClientRoomA1.id
    }).fetch()

  })

  after(async () => {
    await Class.destroy({
      id: [
        class1Private.id,
        class2Regular.id,
        class3Open.id
      ],
    })

  })


  it('should return only private classes if specified', async () => {

    let query = qs.stringify({
      client: testClientId,
      startDate: '2018-05-01',
      endDate: '2018-05-31',
      sessionType: 'private'
    })

    let response = await supertest(sails.hooks.http.app)
      .get('/classes').query(query).expect(200)

    comparePartialObject(
      response.body.classes,
      [
        {
          id: class1Private.id,
        },

      ],
    )

  })

  it('should return only regular classes if specified', async () => {

    const query = qs.stringify({
      client: testClientId,
      startDate: '2018-05-01',
      endDate: '2018-05-31',
      sessionType: 'group'
    })

    const response = await supertest(sails.hooks.http.app)
      .get('/classes').query(query).expect(200)

    comparePartialObject(
      response.body.classes,
      [
        {
          id: class2Regular.id
        },
        {
          id: class3Open.id
        },
      ],
    )

  })

})
