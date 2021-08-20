const supertest = require('supertest')

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID
const fixtures = require('../../../fixtures/factory').fixtures

const comparePartialObject = require('../../../utils/compare-partial-object')

const {authorizeAdmin, authorizeUserAlice} = require('../../../utils/request-helpers')

describe('controllers.Branches.update', () => {

  it('should block access if the branch does not belong to the current client', async () => {

    const tempBranch = await Branch.create({
      client: testClientId + 1,
      name: 'Test branch',
    }).fetch()

    await supertest(sails.hooks.http.app)
      .put(
        '/branches/' + tempBranch.id +
        '?client=' + testClientId,
      )
      .use(authorizeAdmin())
      .send(
        {
          name: 'New name for test branch',
        },
      )
      .expect(403)

    await Branch.destroy({id: tempBranch.id})

  })

  it('should block access if user is not admin', async () => {

    const tempBranch = await Branch.create({
      client: testClientId,
      name: 'Test branch',
    }).fetch()

    await supertest(sails.hooks.http.app)
      .put(
        '/branches/' + tempBranch.id +
        '?client=' + testClientId,
      )
      .send(
        {
          name: 'New name for test branch',
        },
      )
      .set('Authorization', 'Bearer ' + fixtures.userAliceAccessToken)
      .expect(403)

    await Branch.destroy({id: tempBranch.id})

  })

  it('should update the specified branch', async () => {

    const tempBranch = await Branch.create({
      client: testClientId,
      name: 'Test branch',
    }).fetch()

    const response = await supertest(sails.hooks.http.app)
      .put(
        '/branches/' + tempBranch.id +
        '?client=' + testClientId,
      )
      .send(
        {
          name: 'New name for test branch',
        },
      )
      .set('Authorization', 'Bearer ' + fixtures.userAdminAccessToken)
      .set('X-Yogo-Request-Context', 'admin')
      .expect(200)

    comparePartialObject(
      response.body,
      {
        client: testClientId,
        id: tempBranch.id,
        name: 'New name for test branch',
      },
      'updated branch',
    )

    const dbBranch = await Branch.findOne(tempBranch.id)

    comparePartialObject(
      dbBranch,
      {
        client: testClientId,
        id: tempBranch.id,
        name: 'New name for test branch',
      },
      'dbBranch',
    )

    await Branch.destroy({id: tempBranch.id})

  })


})
