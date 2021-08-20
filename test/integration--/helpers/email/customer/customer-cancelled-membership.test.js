const testClientId = require('../../../../global-test-variables').TEST_CLIENT_ID;
const fixtures = require('../../../../fixtures/factory').fixtures;
const sinon = require('sinon');
const emailSendFakeFactory = require('../../../../fakes/email-send-fake-factory');
const MockDate = require('mockdate');
const moment = require('moment-timezone');

describe('helpers.email.customer.customer-cancelled-membership', async () => {

  let emailSendFake;

  beforeEach(async () => {
    emailSendFake = emailSendFakeFactory.installEmailSendFake();
    await Membership.destroy({});
    await ClientSettings.destroy({});
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should send an email about the cancelled membership in English', async () => {

    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2016-06-15',
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'cancelled_running',
      cancelled_from_date: '2016-07-16',
      client: testClientId,
      payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
    }).fetch();

    await sails.helpers.email.customer.customerCancelledMembership(membership);

    expect(emailSendFake.firstCall.args[0]).to.matchPattern(`
      {        
        user: {id: ${fixtures.userAlice.id}, ... },
        subject: 'You have cancelled your Yoga Unlimited membership',
        text: 'Dear Alice,\\n\\nYou have cancelled your Yoga Unlimited membership.\\n\\nThere is a one-month notice on the membership and therefore the membership will terminate one month after your next payment, i.e Saturday, July 16, 2016.\\n\\nKind regards,\\nTest client',
        blindCopyToClient: true,
        emailType: 'customer_cancelled_membership'
      }`,
    );

    await Membership.destroy({id: membership.id});

  });

  it('should send an email about the cancelled membership in Danish', async () => {

    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'locale',
      value: 'da',
    }).fetch();

    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2016-06-15',
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'cancelled_running',
      cancelled_from_date: '2016-07-16',
      client: testClientId,
      payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
    }).fetch();

    await sails.helpers.email.customer.customerCancelledMembership(membership);

    expect(emailSendFake.firstCall.args[0]).to.matchPattern(`
      {        
        user: {id: ${fixtures.userAlice.id}, ... },
        subject: 'Du har opsagt dit medlemskab Yoga Unlimited',
        text: 'Kære Alice\\n\\nDu har opsagt dit medlemskab Yoga Unlimited.\\n\\nDer er en måneds opsigelse på medlemskabet.\\n\\nMedlemskabet stopper en måned efter næste betaling, dvs. lørdag d. 16. juli 2016.\\n\\nVenlig hilsen\\nTest client',
        blindCopyToClient: true,
        emailType: 'customer_cancelled_membership'
      }`,
    );

    await Membership.destroy({id: membership.id});
    await ClientSettings.destroy({id: clientSettingsRow.id});

  });

  it('should not send a copy to client if client has deselected that', async () => {

    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'email_bcc_to_client_on_customer_cancel_or_resume_membership',
      value: 0,
    }).fetch();

    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2016-06-15',
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'cancelled_running',
      cancelled_from_date: '2016-07-16',
      client: testClientId,
      payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
    }).fetch();

    await sails.helpers.email.customer.customerCancelledMembership(membership);

    expect(emailSendFake.firstCall.args[0]).to.matchPattern(`{
        user: {id: ${fixtures.userAlice.id}, ... },
        subject: 'You have cancelled your Yoga Unlimited membership',
        blindCopyToClient: false,
        ...
      }`,
    );

    await Membership.destroy({id: membership.id});
    await ClientSettings.destroy({id: clientSettingsRow.id});

  });


  it('should adjust the text when a longer payment option is chosen', async () => {

    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2016-06-15',
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'cancelled_running',
      cancelled_from_date: '2016-07-16',
      client: testClientId,
      payment_option: fixtures.yogaUnlimitedPaymentOptionSemiannually.id,
    }).fetch();

    await sails.helpers.email.customer.customerCancelledMembership(membership);

    expect(emailSendFake.firstCall.args[0]).to.matchPattern(`
      {
        user: {id: ${fixtures.userAlice.id}, ... },
        subject: 'You have cancelled your Yoga Unlimited membership',
        text: 'Dear Alice,\\n\\nYou have cancelled your Yoga Unlimited membership.\\n\\nThe membership will terminate at the end of the paid period, i.e Saturday, July 16, 2016.\\n\\nKind regards,\\nTest client',
        ...
      }`,
    );

    await Membership.destroy({id: membership.id});

  });

  it('should account for a membership pause that affects the termination date', async () => {

    MockDate.set(moment.tz('2020-06-01', 'Europe/Copenhagen'));

    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2016-06-15',
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'cancelled_running',
      cancelled_from_date: '2016-07-16',
      client: testClientId,
      payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
    }).fetch();

    const membershipPause = await MembershipPause.create({
      client_id: testClientId,
      membership_id: membership.id,
      start_date: '2020-06-16',
      end_date: '2020-07-16',
    }).fetch();

    await sails.helpers.email.customer.customerCancelledMembership(membership);

    expect(emailSendFake.firstCall.args[0]).to.matchPattern(`
      {
        user: {id: ${fixtures.userAlice.id}, ... },
        subject: 'You have cancelled your Yoga Unlimited membership',
        text: 'Dear Alice,\\n\\nYou have cancelled your Yoga Unlimited membership.\\n\\nThere is a one-month notice on the membership and therefore the membership will terminate one month after your next payment, i.e Monday, August 15, 2016.\\n\\nKind regards,\\nTest client',
        ...
      }`,
    );

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: membershipPause.id});

  });

});
