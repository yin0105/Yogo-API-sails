const supertest = require('supertest')

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID
const fixtures = require('../../../fixtures/factory').fixtures

const compareDbCollection = require('../../../utils/compare-db-collection')
const comparePartialObject = require('../../../utils/compare-partial-object')


describe('controllers.Events.find-one', () => {

  let event1

  before(async () => {
    event1 = await Event.create({
      client: testClientId,
      seats: 3,
    }).fetch()
  })

  after(async () => {
    await Event.destroy({
      id: event1.id,
    })
  })

  it('should return the specified event', async () => {

    const responseJson = await supertest(sails.hooks.http.app)
      .get(
        '/events/' + event1.id +
        '?client=' + testClientId,
      )
      //.set('Authorization', 'Bearer ' + fixtures.userAliceAccessToken)
      .expect(200)

    const result = JSON.parse(responseJson.text)

    comparePartialObject(
      result,
      {
        id: event1.id,
        seats: 3
      },
    )


  })

})
