const assert = require('assert');
const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID;

const fixtures = require('../../../fixtures/factory').fixtures;

const emailTransportStubFactory = require('../../../stubs/get-email-transport-send-email-spy');

describe('helpers.email.send', async function () {

  let emailTransportSendStub;

  before(async () => {

    emailTransportSendStub = emailTransportStubFactory.createStub();

  });

  beforeEach(async () => {
    await EmailLog.destroy({});
  });

  afterEach(() => {
    emailTransportSendStub.resetHistory();
  });

  after(async () => {
    emailTransportStubFactory.destroy();
    await EmailLog.destroy({});
  });

  it('should send an email', async () => {

    await sails.helpers.email.send.with({
      user: fixtures.userAlice,
      subject: 'Test email',
      text: 'Testing email sending',
      html: '<p>Testing email sending</p>',
      attachments: [
        {
          filename: 'file1.txt',
          content: 'Attachment file content text',
        },
      ],
      emailType: 'test_email',
    });

    expect(emailTransportSendStub.firstCall.args[0]).to.matchPattern(
      {
        from: '"Test client" <noreply@yogo.dk>',
        to: 'userAlice@yogo.dk',
        cc: undefined,
        bcc: ['oleksandrdeinekait@gmail.com'],
        subject: 'Test email',
        text: 'Testing email sending',
        html: '<p>Testing email sending</p>',
        attachments: [
          {
            filename: 'file1.txt',
            content: 'Attachment file content text',
          },
        ],
      },
    );

    const emailLogEntry = await EmailLog.find({});
    expect(emailLogEntry).to.matchPattern(`
      [{
        id: _.isInteger,
        createdAt: _.isInteger,
        updatedAt: _.isInteger,
        archived: false,
        client_id: ${testClientId},
        user_id: ${fixtures.userAlice.id},
        from: '"Test client" <noreply@yogo.dk>',
        to: 'userAlice@yogo.dk',
        bcc: 'oleksandrdeinekait@gmail.com',
        subject: 'Test email',
        text: 'Testing email sending',
        html: '<p>Testing email sending</p>',
        attachments: 'file1.txt',
        class_id: null,
        class_email_id: null,
        class_type_email_id: null,
        email_type: 'test_email',
        email_provider_id: '',
        email_provider_status: '',
      }]`
    );

  });

  it('should reroute the email to a specified address if config says so', async () => {

    sails.config.email.sendRealEmails = false;
    sails.config.email.sendAllEmailsTo = 'test-receiver@yogo.dk';

    await sails.helpers.email.send.with({
      user: fixtures.userAlice.id,
      subject: 'Test email',
      text: 'Testing email sending',
      html: '<p>Testing email sending</p>',
      attachments: [
        {
          filename: 'file1.txt',
          content: 'Attachment file content text',
        },
      ],
      emailType: 'test_email',
    });

    expect(emailTransportSendStub.firstCall.args[0]).to.matchPattern(
      {
        from: '"Test client" <noreply@yogo.dk>',
        to: 'test-receiver@yogo.dk',
        subject: 'Test email',
        text: 'Testing email sending',
        html: '<p>Testing email sending</p>',
        attachments: [
          {
            filename: 'file1.txt',
            content: 'Attachment file content text',
          },
        ],
      },
    );

    sails.config.email.sendRealEmails = true;

  });

  it('should send a bcc to client if client wants it', async () => {

    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'email_bcc_to_client_send_to',
      value: 'email_bcc_to_client@example.com',
    }).fetch();

    await sails.helpers.email.send.with({
      user: fixtures.userAlice,
      subject: 'Test email',
      text: 'Test email',
      html: '<p>Test email</p>',
      blindCopyToClient: true,
      emailType: 'test_email',
    });

    assert.deepEqual(
      emailTransportSendStub.firstCall.args[0],
      {
        from: '"Test client" <noreply@yogo.dk>',
        to: 'userAlice@yogo.dk',
        bcc: ['oleksandrdeinekait@gmail.com', 'email_bcc_to_client@example.com'],
        subject: 'Test email',
        text: 'Test email',
        html: '<p>Test email</p>',
      },
    );

    await ClientSettings.destroy({id: clientSettingsRow.id});

  });

  it('should not send a bcc to YOGO if not specified in config', async () => {

    const originalBccRedipient = sails.config.email.sendBlindCopyOfAllEmailsTo;
    delete sails.config.email.sendBlindCopyOfAllEmailsTo;

    await sails.helpers.email.send.with({
      user: fixtures.userAlice,
      subject: 'Test email',
      text: 'Test email',
      html: '<p>Test email</p>',
      emailType: 'test_email',
    });

    expect(emailTransportSendStub.firstCall.args[0]).to.matchPattern(
      {
        from: '"Test client" <noreply@yogo.dk>',
        to: 'userAlice@yogo.dk',
        subject: 'Test email',
        text: 'Test email',
        html: '<p>Test email</p>',
      },
    );

    sails.config.email.sendBlindCopyOfAllEmailsTo = originalBccRedipient;

  });

  it('should make the html version automatically if not provided', async () => {

    await sails.helpers.email.send.with({
      user: fixtures.userAlice,
      subject: 'Test email',
      text: 'Test email\nLine 2',
      emailType: 'test_email',
    });

    assert.deepEqual(
      emailTransportSendStub.firstCall.args[0],
      {
        from: '"Test client" <noreply@yogo.dk>',
        to: 'userAlice@yogo.dk',
        bcc: ['oleksandrdeinekait@gmail.com'],
        subject: 'Test email',
        text: 'Test email\nLine 2',
        html: 'Test email<br>\nLine 2',
      },
    );

  });

  it('should log email to db', async () => {

    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'email_bcc_to_client_send_to',
      value: 'email_bcc_to_client@example.com',
    }).fetch();

    await sails.helpers.email.send.with({
      user: fixtures.userAlice,
      subject: 'Test email',
      text: 'Test email\nLine 2',
      html: 'Test email<br>Line 2',
      attachments: [
        {
          filename: 'file1.txt',
          content: 'Attachment file content text',
        },
        {
          filename: 'file2.txt',
          content: 'Attachment file 2 content text',
        },
      ],
      emailType: 'test_email',
      blindCopyToClient: true
    });

    expect(emailTransportSendStub.firstCall.args[0]).to.matchPattern(`
      {
        from: '"Test client" <noreply@yogo.dk>',
        to: 'userAlice@yogo.dk',
        bcc: ['oleksandrdeinekait@gmail.com', 'email_bcc_to_client@example.com'],
        subject: 'Test email',
        text: 'Test email\\nLine 2',
        html: 'Test email<br>Line 2',
        attachments: [
          {
            filename: 'file1.txt',
            content: 'Attachment file content text',
          },
          {
            filename: 'file2.txt',
            content: 'Attachment file 2 content text',
          },
        ],
      }`
    );

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
      bcc: 'oleksandrdeinekait@gmail.com,email_bcc_to_client@example.com',
      subject: 'Test email',
      text: 'Test email\\nLine 2',
      html: 'Test email<br>Line 2',
      attachments: 'file1.txt,file2.txt',
      class_id: null,
      class_email_id: null,
      class_type_email_id: null,
      email_type: 'test_email',
      email_provider_id: '',
      email_provider_status: '',
    }]`);

    await ClientSettings.destroy({id: clientSettingsRow.id});


  });

  it('should log redacted subject, text and html. Html not specified', async () => {

    await sails.helpers.email.send.with({
      user: fixtures.userAlice,
      subject: 'Test email with a SECRET_PASSWORD',
      subjectForLog: 'Test email with a [password]',
      text: 'Test email TEXT with a SECRET_PASSWORD\nLine 2',
      textForLog: 'Test email TEXT with a [password]\nLine 2',
      emailType: 'test_email',
    });

    expect(emailTransportSendStub.firstCall.args[0]).to.matchPattern(`
      {
        from: '"Test client" <noreply@yogo.dk>',
        to: 'userAlice@yogo.dk',
        bcc: ['oleksandrdeinekait@gmail.com'],
        subject: 'Test email with a SECRET_PASSWORD',
        text: 'Test email TEXT with a SECRET_PASSWORD\\nLine 2',
        html: 'Test email TEXT with a SECRET_PASSWORD<br>\\nLine 2',
      }`
    );

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
      subject: 'Test email with a [password]',
      text: 'Test email TEXT with a [password]\\nLine 2',
      html: 'Test email TEXT with a [password]<br>\\nLine 2',
      attachments: '',
      class_id: null,
      class_email_id: null,
      class_type_email_id: null,
      email_type: 'test_email',
      email_provider_id: '',
      email_provider_status: '',
    }]`);

  });

  it('should log redacted subject, text and html. Html specified', async () => {

    await sails.helpers.email.send.with({
      user: fixtures.userAlice,
      subject: 'Test email with a SECRET_PASSWORD',
      subjectForLog: 'Test email with a [password]',
      text: 'Test email TEXT with a SECRET_PASSWORD\nLine 2',
      textForLog: 'Test email TEXT with a [password]\nLine 2',
      html: 'Test email HTML with a SECRET_PASSWORD<br>Line 2',
      htmlForLog: 'Test email HTML with a [password]<br>Line 2',
      emailType: 'test_email',
    });

    expect(emailTransportSendStub.firstCall.args[0]).to.matchPattern(`
      {
        from: '"Test client" <noreply@yogo.dk>',
        to: 'userAlice@yogo.dk',
        bcc: ['oleksandrdeinekait@gmail.com'],
        subject: 'Test email with a SECRET_PASSWORD',
        text: 'Test email TEXT with a SECRET_PASSWORD\\nLine 2',
        html: 'Test email HTML with a SECRET_PASSWORD<br>Line 2',
      }`
    );

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
      subject: 'Test email with a [password]',
      text: 'Test email TEXT with a [password]\\nLine 2',
      html: 'Test email HTML with a [password]<br>Line 2',
      attachments: '',
      class_id: null,
      class_email_id: null,
      class_type_email_id: null,
      email_type: 'test_email',
      email_provider_id: '',
      email_provider_status: '',
    }]`);

  });

  it('should log classId, classEmailId and classTypeEmailId', async () => {

    await sails.helpers.email.send.with({
      user: fixtures.userAlice,
      subject: 'Test email',
      text: 'Test email TEXT',
      html: 'Test email HTML',
      emailType: 'test_email',
      classId: 99,
      classEmailId: 999,
      classTypeEmailId: 9999,
    });

    expect(emailTransportSendStub.firstCall.args[0]).to.matchPattern(`
      {
        from: '"Test client" <noreply@yogo.dk>',
        to: 'userAlice@yogo.dk',
        bcc: ['oleksandrdeinekait@gmail.com'],
        subject: 'Test email',
        text: 'Test email TEXT',
        html: 'Test email HTML',
      }`
    );

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
      subject: 'Test email',
      text: 'Test email TEXT',
      html: 'Test email HTML',
      attachments: '',
      class_id: 99,
      class_email_id: 999,
      class_type_email_id: 9999,
      email_type: 'test_email',
      email_provider_id: '',
      email_provider_status: '',
    }]`);

  });

});
