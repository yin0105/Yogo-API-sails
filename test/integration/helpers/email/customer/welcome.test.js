const testClientId = require('../../../../global-test-variables').TEST_CLIENT_ID
const fixtures = require('../../../../fixtures/factory').fixtures
const emailTransportStubFactory = require('../../../../stubs/get-email-transport-send-email-spy');

describe('helpers.email.welcome', async () => {

  let emailTransportSendStub;

  before(async () => {
    emailTransportSendStub = emailTransportStubFactory.createStub();
    await EmailLog.destroy({})
  });

  afterEach(async () => {
    emailTransportSendStub.resetHistory();
    await EmailLog.destroy({})
  })

  after(async () => {
    emailTransportStubFactory.destroy({});
  })


  it('should send a welcome email in English', async () => {

    await sails.helpers.email.customer.welcome(fixtures.userAlice, 'password')

    expect(emailTransportSendStub.firstCall.args[0]).to.matchPattern(`{     
      from: '"Test client" <noreply@yogo.dk>',
      to: 'userAlice@yogo.dk',
      bcc: [ 'oleksandrdeinekait@gmail.com' ],
      subject: 'Welcome to Test client',
      text: "Dear Alice,\\n\\nWelcome to Test client.\\n\\nYour profile has been created and you can now buy memberships, class passes and events, sign up for classes etc.\\n\\nKind regards,\\nTest client",
      html: "Dear Alice,<br>\\n<br>\\nWelcome to Test client.<br>\\n<br>\\nYour profile has been created and you can now buy memberships, class passes and events, sign up for classes etc.<br>\\n<br>\\nKind regards,<br>\\nTest client",      
    }`)

  })

  it('should send a welcome email in Danish', async () => {

    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'locale',
      value: 'da'
    }).fetch()

    await sails.helpers.email.customer.welcome(fixtures.userAlice, 'password')

    expect(emailTransportSendStub.firstCall.args[0]).to.matchPattern(`{      
      from: '"Test client" <noreply@yogo.dk>',
      to: 'userAlice@yogo.dk',
      bcc: [ 'oleksandrdeinekait@gmail.com' ],
      subject: 'Velkommen til Test client',
      text: "Kære Alice\\n\\nVelkommen til Test client.\\n\\nDin profil er oprettet og du kan nu købe medlemskaber, klippekort og kurser, melde dig til hold m.m.\\n\\nVenlig hilsen\\nTest client",
      html: "Kære Alice<br>\\n<br>\\nVelkommen til Test client.<br>\\n<br>\\nDin profil er oprettet og du kan nu købe medlemskaber, klippekort og kurser, melde dig til hold m.m.<br>\\n<br>\\nVenlig hilsen<br>\\nTest client",      
    }`)

    await ClientSettings.destroy({id: clientSettingsRow.id})

  })

  it('should insert [password], but not log the password', async () => {
    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'email_welcome_body',
      value: '[password]'
    }).fetch()

    await sails.helpers.email.customer.welcome(fixtures.userAlice, 'secretPassword')

    expect(emailTransportSendStub.firstCall.args[0]).to.matchPattern(`{
      from: '"Test client" <noreply@yogo.dk>',
      to: 'userAlice@yogo.dk',
      bcc: [ 'oleksandrdeinekait@gmail.com' ],
      subject: 'Welcome to Test client',
      text: "secretPassword",
      html: "secretPassword",      
    }`)

    const emailLogEntry = await EmailLog.find({});
    expect(emailLogEntry).to.matchPattern(`[{
      id: _.isInteger,
      createdAt: _.isInteger,
      updatedAt: _.isInteger,
      archived: false,
      client_id: ${testClientId},
      user_id: ${fixtures.userAlice.id},
      from: '"Test client" <noreply@yogo.dk>',
      to: 'userAlice@yogo.dk',
      bcc: 'oleksandrdeinekait@gmail.com',
      subject: 'Welcome to Test client',
      text: '[password]',
      html: '[password]',
      attachments: '',
      class_id: null,
      class_email_id: null,
      class_type_email_id: null,
      email_type: 'welcome',
      email_provider_id: '',
      email_provider_status: '',
    }]`)

    await ClientSettings.destroy({id: clientSettingsRow.id})
  })

})
