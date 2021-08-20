const supertest = require('supertest')

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID
const fixtures = require('../../../fixtures/factory').fixtures

const compareDbCollection = require('../../../utils/compare-db-collection')
const comparePartialObject = require('../../../utils/compare-partial-object')


describe('controllers.ClassPassTypes.update', () => {

  let testClassPassType

  before(async () => {

    testClassPassType = await ClassPassType.create({
      client: testClientId,
      pass_type: 'fixed_count',
      number_of_classes: 10,
      name: 'Test class pass',
    }).fetch()

  })

  after(async () => {
    await ClassPassType.destroy({id: testClassPassType.id})
  })


  it('should deny access if user is not admin', async () => {

    await supertest(sails.hooks.http.app)
      .put(
        '/class-pass-types/' + testClassPassType.id +
        '?client=' + testClientId)
      .send(
        {
          number_of_classes: 20,
        },
      )
      .set('Authorization', 'Bearer ' + fixtures.userAliceAccessToken)
      .expect(403)

  })


  it('should update the specified class pass type', async () => {

    const responseJson = await supertest(sails.hooks.http.app)
      .put(
        '/class-pass-types/' + testClassPassType.id +
        '?client=' + testClientId)
      .send(
        {
          number_of_classes: 20,
        },
      )
      .set('Authorization', 'Bearer ' + fixtures.userAdminAccessToken)
      .set('X-Yogo-Request-Context', 'admin')
      .expect(200)

    const result = JSON.parse(responseJson.text)

    comparePartialObject(
      result,
      {
        id: testClassPassType.id,
        number_of_classes: 20,
      },
    )

    const dbClassPassType = await ClassPassType.findOne(testClassPassType.id)

    comparePartialObject(
      dbClassPassType,
      {
        number_of_classes: 20,
      },
    )

  })

})
