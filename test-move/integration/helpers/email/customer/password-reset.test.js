const testClientId = require('../../../../global-test-variables').TEST_CLIENT_ID
const fixtures = require('../../../../fixtures/factory').fixtures
const sinon = require('sinon')
const emailSendFakeFactory = require('../../../../fakes/email-send-fake-factory')


describe('helpers.email.password-reset', async () => {

  let emailSendFake


  beforeEach(async () => {

    emailSendFake = emailSendFakeFactory.installEmailSendFake()

  })

  afterEach(() => {
    sinon.restore()
  })

  it('should send a password reset email in English', async () => {

    await sails.helpers.email.customer.passwordReset(fixtures.userAlice, 'http://localhost:8080/frontend/#/reset-password/{email}')

    expect(emailSendFake.firstCall.args[0]).to.matchPattern(`{      
      user: {id: ${fixtures.userAlice.id}, ...},
      subject: 'Reset password for Test client',
      text: "Dear Alice,\\n\\nYou have requested a password reset for Test client.\\n\\nYou can set a new password by following this link: http://localhost:8080/frontend/#/reset-password/userAlice%40yogo.dk\\n\\nIf it doesn't work, you can copy and paste the link into the address bar in your browser.\\n\\nKind regards,\\nTest client",
      emailType: 'password_reset'
    }`)

  })

  it('should send a password reset email in Danish', async () => {

    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'locale',
      value: 'da'
    }).fetch()

    await sails.helpers.email.customer.passwordReset(fixtures.userAlice, 'http://localhost:8080/frontend/#/reset-password/{email}')

    expect(emailSendFake.firstCall.args[0]).to.matchPattern(`{      
      user: {id: ${fixtures.userAlice.id}, ...},
      subject: 'Nulstilling af din adgangskode hos Test client',
      text: "Kære Alice\\n\\nDu har bedt om at nulstille din adgangskode hos Test client.\\n\\nDu kan indstille en ny adgangskode ved at følge dette link: http://localhost:8080/frontend/#/reset-password/userAlice%40yogo.dk\\n\\nHvis det ikke virker, kan du kopiere linket ind i adresselinjen på din browser.\\n\\nVenlig hilsen\\nTest client",
      emailType: 'password_reset'
    }`)

    await ClientSettings.destroy({id: clientSettingsRow.id})

  })

})
