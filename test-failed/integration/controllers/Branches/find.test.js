const supertest = require('supertest')

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID
const fixtures = require('../../../fixtures/factory').fixtures

const comparePartialObject = require('../../../utils/compare-partial-object')



describe('controllers.Branches.find', () => {

  it('should return all branches for the current client', async () => {

    const response = await supertest(sails.hooks.http.app)
      .get(
        '/branches' +
        '?client=' + testClientId
      )
      .expect(200)

    comparePartialObject(
      response.body,
      [
        {
          client: testClientId,
          id: fixtures.testClientBranchA.id,
          name: 'Branch A',
        },
        {
          client: testClientId,
          id: fixtures.testClientBranchB.id,
          name: 'Branch B',
        },
        {
          client: testClientId,
          id: fixtures.testClientBranchC.id,
          name: 'Branch C',
        },
      ],
      'branches'
    )

  })


})
