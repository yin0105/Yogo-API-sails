const supertest = require('supertest')

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID
const fixtures = require('../../../fixtures/factory').fixtures

const comparePartialObject = require('../../../utils/compare-partial-object')
const compareDbCollection = require('../../../utils/compare-db-collection')

const {authorizeAdmin, authorizeUserAlice} = require('../../../utils/request-helpers')


describe('controllers.Branches.update-sort', () => {

  it('should block access if any of the branches does not belong to the current client', async () => {

    const tempBranch = await Branch.create({
      client: testClientId + 1,
      name: 'Test branch',
    }).fetch()

    await supertest(sails.hooks.http.app)
      .put(
        '/branches/sort' +
        '?client=' + testClientId,
      )
      .use(authorizeAdmin())
      .send(
        {
          sortOrder: [
            tempBranch.id,
            fixtures.testClientBranchA.id,
            fixtures.testClientBranchB.id,
            fixtures.testClientBranchC.id,
          ],
        },
      )
      .expect(403)

    await Branch.destroy({id: tempBranch.id})

  })

  it('should block access if user is not admin', async () => {

    await supertest(sails.hooks.http.app)
      .put(
        '/branches/sort' +
        '?client=' + testClientId,
      )
      .send(
        {
          sortOrder: [
            fixtures.testClientBranchB.id,
            fixtures.testClientBranchA.id,
            fixtures.testClientBranchC.id,
          ],
        },
      )
      .use(authorizeUserAlice())
      .expect(403)

  })

  it('should update the sort order', async () => {

    const response = await supertest(sails.hooks.http.app)
      .put(
        '/branches/sort' +
        '?client=' + testClientId,
      )
      .send(
        {
          sortOrder:
            [
              fixtures.testClientBranchB.id,
              fixtures.testClientBranchA.id,
              fixtures.testClientBranchC.id,
            ],
        },
      )
      .set('Authorization', 'Bearer ' + fixtures.userAdminAccessToken)
      .set('X-Yogo-Request-Context', 'admin')
      .expect(200)

    let dbBranches = await Branch.find({client: testClientId})

    compareDbCollection(
      dbBranches,
      [
        {
          client: testClientId,
          id: fixtures.testClientBranchA.id,
          name: 'Branch A',
          sort: 1,
        },
        {
          client: testClientId,
          id: fixtures.testClientBranchB.id,
          name: 'Branch B',
          sort: 0,
        },
        {
          client: testClientId,
          id: fixtures.testClientBranchC.id,
          name: 'Branch C',
          sort: 2,
        },
      ],
      'dbBranches',
    )

    await supertest(sails.hooks.http.app)
      .put(
        '/branches/sort' +
        '?client=' + testClientId,
      )
      .send(
        {
          sortOrder:
            [
              fixtures.testClientBranchA.id,
              fixtures.testClientBranchB.id,
              fixtures.testClientBranchC.id,
            ],
        },
      )
      .set('Authorization', 'Bearer ' + fixtures.userAdminAccessToken)
      .set('X-Yogo-Request-Context', 'admin')
      .expect(200)

    dbBranches = await Branch.find({client: testClientId})

    compareDbCollection(
      dbBranches,
      [{
        client: testClientId,
        id: fixtures.testClientBranchA.id,
        name: 'Branch A',
        sort: 0,
      },
        {
          client: testClientId,
          id: fixtures.testClientBranchB.id,
          name: 'Branch B',
          sort: 1,
        },
        {
          client: testClientId,
          id: fixtures.testClientBranchC.id,
          name: 'Branch C',
          sort: 2,
        },
      ],
      'dbBranches',
    )

  })


})
