const supertest = require('supertest')

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID
const fixtures = require('../../../fixtures/factory').fixtures

const compareDbCollection = require('../../../utils/compare-db-collection')
const comparePartialObject = require('../../../utils/compare-partial-object')


describe('controllers.ClassPassTypes.destroy', () => {

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
      .delete(
        '/class-pass-types/' + testClassPassType.id +
        '?client=' + testClientId)
      .set('Authorization', 'Bearer ' + fixtures.userAliceAccessToken)
      .expect(403)

  })


  it('should destroy the specified class pass type', async () => {

    const responseJson = await supertest(sails.hooks.http.app)
      .delete(
        '/class-pass-types/' + testClassPassType.id +
        '?client=' + testClientId)
      .set('Authorization', 'Bearer ' + fixtures.userAdminAccessToken)
      .set('X-Yogo-Request-Context', 'admin')
      .expect(200)


    const dbClassPassType = await ClassPassType.findOne(testClassPassType.id)

    comparePartialObject(
      dbClassPassType,
      {
        id: testClassPassType.id,
        archived: true,
      },
      'dbClassPassType'
    )

  })

})
