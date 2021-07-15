const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID
const fixtures = require('../../../fixtures/factory').fixtures

const supertest = require('supertest')

const sinon = require('sinon')
const emailSendFakeFactory = require('../../../fakes/email-send-fake-factory')

describe('controllers.Auth.password-reset-send-token (INCOMPLETE)', async function () {

  let emailSendFake

  beforeEach(async () => {
    emailSendFake = emailSendFakeFactory.installEmailSendFake()
  })

  afterEach(async () => {
    sinon.restore()
  })

  it('should create token and send email', async () => {

    await supertest(sails.hooks.http.app)
      .post('/password-reset-send-token?client=' + testClientId)
      .send({
        email: fixtures.userAlice.email
      })
      .expect(200)
      .expect('OK')

    expect(emailSendFake.getCall(0).args[0]).to.matchPattern(`{
      user: {
        id: ${fixtures.userAlice.id},
        ...
      },      
      ...
    }`)

  })

})
