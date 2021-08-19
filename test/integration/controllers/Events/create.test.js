const supertest = require('supertest')

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID
const fixtures = require('../../../fixtures/factory').fixtures

const compareDbCollection = require('../../../utils/compare-db-collection')
const comparePartialObject = require('../../../utils/compare-partial-object')


describe('controllers.Events.create', () => {


  it('should deny access if user is not admin', async () => {

    await supertest(sails.hooks.http.app)
      .post(
        '/events' +
        '?client=' + testClientId)
      .send(
        {
          client: testClientId,
          seats: 3,
          name: 'Test event',
          price: 2000,
          start_date: '2018-06-13'
        },
      )
      .set('Authorization', 'Bearer ' + fixtures.userAliceAccessToken)
      .expect(403)

  })


  it('should create the specified event', async () => {

    const response = await supertest(sails.hooks.http.app)
      .post(
        '/events' +
        '?client=' + testClientId)
      .send(
        {
          client: testClientId,
          seats: 3,
          name: 'Test event',
          price: 2000,
          start_date: '2018-06-13'
        },
      )
      .set('Authorization', 'Bearer ' + fixtures.userAdminAccessToken)
      .set('X-Yogo-Request-Context', 'admin')
      .expect(200)


    comparePartialObject(
      response.body,
      {
        client: testClientId,
        seats: 3,
        name: 'Test event',
        price: 2000,
      },
    )

    const dbEvent = await Event.findOne(response.body.id)

    comparePartialObject(
      dbEvent,
      {
        client: testClientId,
        seats: 3,
        name: 'Test event',
        price: 2000,
      },
    )

    await Event.destroy({id: response.body.id})

  })

})
