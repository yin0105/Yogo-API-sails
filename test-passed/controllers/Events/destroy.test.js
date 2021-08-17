const supertest = require('supertest')

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID
const fixtures = require('../../../fixtures/factory').fixtures

const compareDbCollection = require('../../../utils/compare-db-collection')
const comparePartialObject = require('../../../utils/compare-partial-object')


describe('controllers.Events.destroy', () => {

  let event1

  before(async () => {

    event1 = await Event.create({
      client: testClientId,
      seats: 10,
      name: 'Test event',
    }).fetch()

  })

  after(async () => {
    await Event.destroy({id: event1.id})
  })


  it('should deny access if user is not admin', async () => {

    await supertest(sails.hooks.http.app)
      .delete(
        '/events/' + event1.id +
        '?client=' + testClientId)
      .set('Authorization', 'Bearer ' + fixtures.userAliceAccessToken)
      .expect(403)

  })


  it('should destroy the specified event', async () => {

    await supertest(sails.hooks.http.app)
      .delete(
        '/events/' + event1.id +
        '?client=' + testClientId)
      .set('Authorization', 'Bearer ' + fixtures.userAdminAccessToken)
      .set('X-Yogo-Request-Context', 'admin')
      .expect(200)


    const dbEvent = await Event.findOne(event1.id)

    comparePartialObject(
      dbEvent,
      {
        id: event1.id,
        seats: 10,
        archived: true,
      },
      'dbEvent',
    )

  })

})
