const supertest = require('supertest')

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID
const fixtures = require('../../../fixtures/factory').fixtures
const {authorizeAdmin, authorizeUserBill} = require('../../../utils/request-helpers')

const comparePartialObject = require('../../../utils/compare-partial-object')

const qs = require('qs')

describe('controllers.Users.find-one', () => {

  it('should return forbidden if user is not admin or the user itself', async () => {

    await supertest(sails.hooks.http.app)
      .get('/users/' + fixtures.userAlice.id + '?client=' + testClientId)
      .expect(403)

    await supertest(sails.hooks.http.app)
      .get('/users/' + fixtures.userAlice.id + '?client=' + testClientId)
      .use(authorizeUserBill())
      .expect(403)

  })


  it('should return the user', async () => {

    const queryParams = {
      client: testClientId,
      populate: [
        'image',
        'cart_items',
        'memberships',
        'class_passes',
      ],
    }

    const response = await supertest(sails.hooks.http.app)
      .get('/users/' + fixtures.userAlice.id + '?' + qs.stringify(queryParams))
      .use(authorizeAdmin())
      .expect(200)


    comparePartialObject(
      response.body,
      {
        email: 'userAlice@yogo.dk',
        cart_items: [],
        class_passes: [],
        memberships: [],
      },
    )
  })

})
