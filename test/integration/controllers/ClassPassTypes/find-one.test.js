const supertest = require('supertest')

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID
const fixtures = require('../../../fixtures/factory').fixtures

const compareDbCollection = require('../../../utils/compare-db-collection')
const comparePartialObject = require('../../../utils/compare-partial-object')


describe('controllers.ClassPassTypes.find-one', () => {


  before(async () => {

  })

  it('should return the specified class pass type', async () => {

    const responseJson = await supertest(sails.hooks.http.app)
      .get(
        '/class-pass-types/' + fixtures.classPassTypeYogaUnlimitedOneMonth.id +
        '?client=' + testClientId
      )
      //.set('Authorization', 'Bearer ' + fixtures.userAliceAccessToken)
      .expect(200)

    const result = JSON.parse(responseJson.text)

    comparePartialObject(
      result,
        {
          id: fixtures.classPassTypeYogaUnlimitedOneMonth.id,
        },
    )


  })

})
