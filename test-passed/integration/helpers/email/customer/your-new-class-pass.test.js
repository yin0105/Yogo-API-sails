const testClientId = require('../../../../global-test-variables').TEST_CLIENT_ID;
const fixtures = require('../../../../fixtures/factory').fixtures;
const sinon = require('sinon');
const emailSendFakeFactory = require('../../../../fakes/email-send-fake-factory')

describe('helpers.email.customer.your-new-class-pass', async () => {

  let emailSendFake;

  beforeEach(async () => {
    emailSendFake = emailSendFakeFactory.installEmailSendFake()
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should send the email that is specified in the class pass type', async () => {

    const myClassPassType = await ClassPassType.create({
      client: testClientId,
      name: 'My class pass',
      pass_type: 'fixed_count',
      number_of_classes: 10,
      send_email_to_customer: true,
      email_subject: 'Test subject',
      email_body: 'Profile link: [customer_profile_link], Class pass name: [class_pass_name], Class pass number of classes [class_pass_number_of_classes], Class pass valid until date: [class_pass_valid_until_date] Studio name: [studio_name], Customer first name: [first_name]',
    }).fetch();

    const myClassPass = await ClassPass.create({
      class_pass_type: myClassPassType.id,
      client: testClientId,
      valid_until: '2020-09-02',
      classes_left: 10,
      user: fixtures.userAlice.id,
    }).fetch();

    await sails.helpers.email.customer.yourNewClassPass(myClassPass);

    expect(emailSendFake.firstCall.args[0]).to.matchPattern(`{
      user: {id: ${fixtures.userAlice.id}, ...},
      subject: 'Test subject',
      text: "Profile link: https://test-client.yogo.dk/frontend/index.html#/my-profile, Class pass name: My class pass, Class pass number of classes 10, Class pass valid until date: Wednesday, September 2, 2020 Studio name: Test client, Customer first name: Alice",
      emailType: 'your_new_class_pass'
    }`);

    await ClassPassType.destroy({id: myClassPassType.id});
    await ClassPass.destroy({id: myClassPass.id});

  });

});
