const supertest = require('supertest')

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID
const fixtures = require('../../../fixtures/factory').fixtures

const compareDbCollection = require('../../../utils/compare-db-collection')
const comparePartialObject = require('../../../utils/compare-partial-object')


describe('controllers.Events.update', () => {

  let event1

  before(async () => {

    event1 = await Event.create({
      client: testClientId,
      seats: 3,
      name: 'Test event',
      price: 2000,
      start_date: '2018-06-13'
    }).fetch()

  })

  after(async () => {
    await Event.destroy({id: event1.id})
  })


  it('should deny access if user is not admin', async () => {

    await supertest(sails.hooks.http.app)
      .put(
        '/events/' + event1.id +
        '?client=' + testClientId)
      .send(
        {
          seats: 20,
          name: 'Test event',
          start_date: '2018-06-13'
        },
      )
      .set('Authorization', 'Bearer ' + fixtures.userAliceAccessToken)
      .expect(403)

  })


  it('should update the specified event', async () => {

    const response = await supertest(sails.hooks.http.app)
      .put(
        '/events/' + event1.id +
        '?client=' + testClientId)
      .send(
        {
          seats: 20,
          name: 'Test event',
          start_date: '2018-06-13',
          price: 2000
        },
      )
      .set('Authorization', 'Bearer ' + fixtures.userAdminAccessToken)
      .set('X-Yogo-Request-Context', 'admin')
      .expect(200)


    comparePartialObject(
      response.body,
      {
        id: event1.id,
        seats: 20,
        name: 'Test event',
      },
      'response.body'
    )

    const dbEvent = await Event.findOne(event1.id)

    comparePartialObject(
      dbEvent,
      {
        id: event1.id,
        seats: 20,
        name: 'Test event',
      },
      'dbEvent',
    )

  })

})
