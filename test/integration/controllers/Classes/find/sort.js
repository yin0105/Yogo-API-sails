const supertest = require('supertest')
const qs = require('qs')
const assert = require('assert')

const testClientId = require('../../../../global-test-variables').TEST_CLIENT_ID
const fixtures = require('../../../../fixtures/factory').fixtures
const comparePartialObject = require('../../../../utils/compare-partial-object')
const MockDate = require('mockdate')
const moment = require('moment-timezone')

const {authorizeUserAlice} = require('../../../../utils/request-helpers')

describe('sort', () => {

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
      room: fixtures.testClientRoomA1.id
    }).fetch()

    class3 = await Class.create({
      client: testClientId,
      class_type: fixtures.classTypeHotYoga.id,
      date: '2018-05-16',
      start_time: '18:00:00',
      end_time: '20:00:00',
      teachers: [fixtures.userAlice.id],
      seats: 20,
      room: fixtures.testClientRoomA2.id
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


  it('should return classes sorted as specified', async () => {

    let query = qs.stringify({
      client: testClientId,
      startDate: '2018-05-01',
      endDate: '2018-05-31',
      sort: ['date ASC','start_time DESC']
    })

    let response = await supertest(sails.hooks.http.app)
      .get('/classes').query(query).expect(200)

    comparePartialObject(
      response.body.classes,
      [
        {
          id: class1.id,
        },
        {
          id: class3.id,
        },
        {
          id: class2.id,
        },
      ],
    )


    query = qs.stringify({
      client: testClientId,
      startDate: '2018-05-01',
      endDate: '2018-05-31',
      sort: ['date DESC','start_time ASC']
    })

    response = await supertest(sails.hooks.http.app)
      .get('/classes').query(query).expect(200)

    comparePartialObject(
      response.body.classes,
      [
        {
          id: class2.id
        },
        {
          id: class3.id,
        },
        {
          id: class1.id,
        },
      ],
    )

  })

})
