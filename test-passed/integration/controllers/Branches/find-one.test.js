const supertest = require('supertest')

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID
const fixtures = require('../../../fixtures/factory').fixtures

const comparePartialObject = require('../../../utils/compare-partial-object')


describe('controllers.Branches.find-one', () => {

  it('should throw a badRequest if the branch does not belong to the current client', async () => {

    const tempBranch = await Branch.create({
      client: testClientId + 1,
      name: 'Test branch for other client',
    }).fetch()

    const response = await supertest(sails.hooks.http.app)
      .get(
        '/branches/' + tempBranch.id +
        '?client=' + testClientId,
      )
      .expect(400)

    await Branch.destroy({id: tempBranch.id})

  })

  it('should return the specified branch', async () => {

    const response = await supertest(sails.hooks.http.app)
      .get(
        '/branches/' + fixtures.testClientBranchA.id +
        '?client=' + testClientId,
      )
      .expect(200)

    comparePartialObject(
      response.body,
      {
        client: testClientId,
        id: fixtures.testClientBranchA.id,
        name: 'Branch A',
      },
      'branches',
    )

  })


})
