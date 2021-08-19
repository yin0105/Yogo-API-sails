const testClientId = require('../../../../global-test-variables').TEST_CLIENT_ID;
const fixtures = require('../../../../fixtures/factory').fixtures;
const sinon = require('sinon');
const emailSendFakeFactory = require('../../../../fakes/email-send-fake-factory')

describe('helpers.email.customer.your-new-membership', async () => {

  let emailSendFake;

  beforeEach(async () => {
    emailSendFake = emailSendFakeFactory.installEmailSendFake()
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should send the email that is specified in the membership type', async () => {

    const testMembershipType = await MembershipType.create({
      client: testClientId,
      name: 'Test membership',
      send_email_to_customer: true,
      email_subject: 'Test membership subject',
      email_body: 'Membership edit link: [membership_edit_link], Membership name: [membership_name], Membership paid until date [membership_paid_until_date], Membership renewal date: [membership_renewal_date], Membership payment amount: [membership_payment_amount], Studio name: [studio_name], Customer first name: [first_name]',
    }).fetch();

    const testPaymentOption = await MembershipTypePaymentOption.create({
      client: testClientId,
      membership_type: testMembershipType.id,
      payment_amount: 400
    }).fetch()

    const testMembership = await Membership.create({
      membership_type: testMembershipType.id,
      client: testClientId,
      paid_until: '2020-09-02',
      user: fixtures.userAlice.id,
      payment_option: testPaymentOption.id
    }).fetch();


    await sails.helpers.email.customer.yourNewMembership(testMembership);

    expect(emailSendFake.firstCall.args[0]).to.matchPattern(`{
      user: {id: ${fixtures.userAlice.id}, ...},
      subject: 'Test membership subject',
      text: "Membership edit link: https://test-client.yogo.dk/frontend/index.html#/membership/${testMembership.id}, Membership name: Test membership, Membership paid until date Wednesday, September 2, 2020, Membership renewal date: Thursday, September 3, 2020, Membership payment amount: 400,00, Studio name: Test client, Customer first name: Alice",
      emailType: 'your_new_membership'
    }`);

    await MembershipType.destroy({id: testMembershipType.id});
    await Membership.destroy({id: testMembership.id});
    await MembershipTypePaymentOption.destroy({id: testPaymentOption.id})

  });

});
