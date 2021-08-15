const supertest = require('supertest')

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID
const fixtures = require('../../../fixtures/factory').fixtures

describe('controllers.Clients.logo', () => {

  it('should return a badRequest for invalid client', async () => {

    await supertest(sails.hooks.http.app)
      .get(
        '/clients/' + (testClientId + 99999) + '/logo' +
        '?w=300' +
        '&h=300',
      )
      .expect(400)
      .expect('"Invalid client"')

  })

  it('should return an empty string if client has no logo', async () => {

    const clientLogoId = (await Client.findOne({id: testClientId})).logo

    await Client.update({id: testClientId}, {logo: null})

    await supertest(sails.hooks.http.app)
      .get(
        '/clients/' + testClientId + '/logo' +
        '?w=300' +
        '&h=300',
      )
      .expect(200)
      .expect('""')

    await Client.update({id: testClientId}, {logo: clientLogoId})

  })

  it('should return a redirect to Imgix for the client\'s logo', async () => {
    await supertest(sails.hooks.http.app)
      .get(
        '/clients/' + testClientId + '/logo' +
        '?w=300' +
        '&h=300',
      )
      .expect(302)
      .expect('Found. Redirecting to ' + sails.config.imgixServer + '/' + fixtures.testClientLogo.filename + '?w=300&h=300')
  })

  it('should use w=200, h=200 as defaults', async () => {

    await supertest(sails.hooks.http.app)
      .get(
        '/clients/' + testClientId + '/logo',
      )
      .expect(302)
      .expect('Found. Redirecting to ' + sails.config.imgixServer + '/' + fixtures.testClientLogo.filename + '?w=200&h=200')

  })

})
