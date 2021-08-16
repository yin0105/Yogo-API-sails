const testClientId = require('../../../../global-test-variables').TEST_CLIENT_ID;
const fixtures = require('../../../../fixtures/factory').fixtures;
const sinon = require('sinon');
const emailSendFakeFactory = require('../../../../fakes/email-send-fake-factory')

describe('helpers.email.customer.your-new-event', async () => {

  let emailSendFake;

  beforeEach(async () => {
    emailSendFake = emailSendFakeFactory.installEmailSendFake()
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should send the email that is specified on the event', async () => {

    const testEvent = await Event.create({
      client: testClientId,
      name: 'Test event',
      send_email_to_customer: true,
      email_subject: 'Test event subject',
      email_body: 'Profile link: [customer_profile_link], Studio name: [studio_name], Customer first name: [first_name]',
    }).fetch();

    const testEventSignup = await EventSignup.create({
      event: testEvent.id,
      client: testClientId,
      user: fixtures.userAlice.id,
    }).fetch();

    await sails.helpers.email.customer.yourNewEvent(testEventSignup);

    expect(emailSendFake.firstCall.args[0]).to.matchPattern(`{
      user: {id: ${fixtures.userAlice.id}, ...},
      subject: 'Test event subject',
      text: "Profile link: https://test-client.yogo.dk/frontend/index.html#/my-profile, Studio name: Test client, Customer first name: Alice",
      emailType: 'your_new_event'
    }`);

    await Event.destroy({id: testEvent.id});
    await EventSignup.destroy({id: testEventSignup.id});

  });

});
