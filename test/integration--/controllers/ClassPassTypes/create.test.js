const supertest = require('supertest')

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID
const fixtures = require('../../../fixtures/factory').fixtures

const compareDbCollection = require('../../../utils/compare-db-collection')
const comparePartialObject = require('../../../utils/compare-partial-object')


describe('controllers.ClassPassTypes.create', () => {


  it('should deny access if user is not admin', async () => {

    await supertest(sails.hooks.http.app)
      .post(
        '/class-pass-types' +
        '?client=' + testClientId)
      .send(
        {
          client: testClientId,
          pass_type: 'fixed_count',
          number_of_classes: 10,
          name: 'Test class pass',
        },
      )
      .set('Authorization', 'Bearer ' + fixtures.userAliceAccessToken)
      .expect(403)

  })


  it('should create the specified class pass type', async () => {

    const responseJson = await supertest(sails.hooks.http.app)
      .post(
        '/class-pass-types' +
        '?client=' + testClientId)
      .send(
        {
          client: testClientId,
          pass_type: 'fixed_count',
          number_of_classes: 10,
          name: 'Test class pass',
        },
      )
      .set('Authorization', 'Bearer ' + fixtures.userAdminAccessToken)
      .set('X-Yogo-Request-Context', 'admin')
      .expect(200)

    const result = JSON.parse(responseJson.text)

    comparePartialObject(
      result,
      {
        client: testClientId,
        pass_type: 'fixed_count',
        number_of_classes: 10,
        name: 'Test class pass',
      },
    )

    const dbClassPassType = await ClassPassType.findOne(result.id)

    comparePartialObject(
      dbClassPassType,
      {
        client: testClientId,
        pass_type: 'fixed_count',
        number_of_classes: 10,
        name: 'Test class pass',
      },
    )

    await ClassPassType.destroy({id: result.id})


  })

})
