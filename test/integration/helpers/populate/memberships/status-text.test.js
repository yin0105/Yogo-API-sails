const testClientId = require('../../../../global-test-variables').TEST_CLIENT_ID;
const fixtures = require('../../../../fixtures/factory').fixtures;
const moment = require('moment-timezone');
const MockDate = require('mockdate');

describe('helpers.populate.memberships.status-text', async () => {

  let i18n;

  before(async () => {
    i18n = sails.helpers.i18N.create();
  });

  afterEach(async () => {
    MockDate.reset();
  });

  it('should return an empty array if input array is empty', async () => {

    const result = await sails.helpers.populate.memberships.statusText([], i18n);

    expect(result).to.deep.equal([]);

  });

  it('should return input unchanged if input is already populated', async () => {

    const memberships = [
      {
        status_text: 'Paused',
      },
      {
        status_text: 'Payment failed',
      },
    ];

    await sails.helpers.populate.memberships.statusText(memberships, i18n);

    expect(memberships).to.matchPattern(`[
      {
        status_text: 'Paused',
      },
      {
        status_text: 'Payment failed',
      },
    ]`);

  });

  it('should return input unchanged if input is already populated with empty values', async () => {

    const memberships = [
      {
        status_text: '',
      },
      {
        status_text: '',
      },
    ];

    await sails.helpers.populate.memberships.statusText(memberships, i18n);

    expect(memberships).to.matchPattern(`[
      {
        status_text: '',
      },
      {
        status_text: '',
      },
    ]`);

  });

  it('should return input unchanged if input is already populated with null values', async () => {

    const memberships = [
      {
        status_text: null,
      },
    ];

    await sails.helpers.populate.memberships.statusText(memberships, i18n);

    expect(memberships).to.matchPattern(`[
      {
        status_text: null,
      },      
    ]`);

  });

  it('should populate active membership', async () => {

    const membership = (
      await Membership.create({
        client: testClientId,
        membership_type: fixtures.membershipTypeYogaUnlimited.id,
        paid_until: '2020-05-31',
        status: 'active',
        payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
      }).fetch()
    ).toJSON();

    const paymentSubscription = await PaymentSubscription.create({
      membership: membership.id,
      status: 'active'
    }).fetch();

    await sails.helpers.populate.memberships.statusText([membership], i18n);

    expect(membership).to.matchPattern(`{
      client: ${testClientId},
      membership_type: ${fixtures.membershipTypeYogaUnlimited.id},
      paid_until: '2020-05-31',
      status: 'active',
      status_text: 'Active.',
      ...
    }`);

    await Membership.destroy({id: membership.id});
    await PaymentSubscription.destroy({id: paymentSubscription.id});

  });

  it('should populate paused membership', async () => {

    const membership = (
      await Membership.create({
        client: testClientId,
        membership_type: fixtures.membershipTypeYogaUnlimited.id,
        paid_until: '2020-05-31',
        status: 'active',
        payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
      }).fetch()
    ).toJSON();

    const paymentSubscription = await PaymentSubscription.create({
      membership: membership.id,
      status: 'active'
    }).fetch();

    const membershipPause = await MembershipPause.create({
      client_id: testClientId,
      membership_id: membership.id,
      start_date: '2020-05-10',
    }).fetch();

    MockDate.set(moment.tz('2020-05-15', 'Europe/Copenhagen'))
    await sails.helpers.populate.memberships.statusText([membership], i18n);

    expect(membership).to.matchPattern(`{
      client: ${testClientId},
      membership_type: ${fixtures.membershipTypeYogaUnlimited.id},
      paid_until: '2020-05-31',
      status: 'active',
      status_text: 'Paused.',
      ...
    }`);

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: membershipPause.id});
    await PaymentSubscription.destroy({id: paymentSubscription.id});

  });

  it('should populate membership with pause scheduled', async () => {

    const membership = (
      await Membership.create({
        client: testClientId,
        membership_type: fixtures.membershipTypeYogaUnlimited.id,
        paid_until: '2020-05-31',
        status: 'active',
        payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
      }).fetch()
    ).toJSON();

    const paymentSubscription = await PaymentSubscription.create({
      membership: membership.id,
      status: 'active'
    }).fetch();

    const membershipPause = await MembershipPause.create({
      client_id: testClientId,
      membership_id: membership.id,
      start_date: '2020-05-20',
    }).fetch();

    MockDate.set(moment.tz('2020-05-10', 'Europe/Copenhagen'));
    await sails.helpers.populate.memberships.statusText([membership], i18n);

    expect(membership).to.matchPattern(`{
      client: ${testClientId},
      membership_type: ${fixtures.membershipTypeYogaUnlimited.id},
      paid_until: '2020-05-31',
      status: 'active',
      status_text: 'Pause scheduled.',
      ...
    }`);

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: membershipPause.id});
    await PaymentSubscription.destroy({id: paymentSubscription.id});

  });

  it('should populate archived membership', async () => {

    const membership = (
      await Membership.create({
        client: testClientId,
        membership_type: fixtures.membershipTypeYogaUnlimited.id,
        paid_until: '2020-05-31',
        status: 'active',
        payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
        archived: 1,
      }).fetch()
    ).toJSON();

    MockDate.set(moment.tz('2020-05-10', 'Europe/Copenhagen'));
    await sails.helpers.populate.memberships.statusText([membership], i18n);

    expect(membership).to.matchPattern(`{
      client: ${testClientId},
      membership_type: ${fixtures.membershipTypeYogaUnlimited.id},
      paid_until: '2020-05-31',
      status: 'active',
      status_text: 'Deleted.',
      archived: true,
      ...
    }`);

    await Membership.destroy({id: membership.id});

  })

  it('should populate membership with no payment methods', async () => {

    const membership = (
      await Membership.create({
        client: testClientId,
        membership_type: fixtures.membershipTypeYogaUnlimited.id,
        paid_until: '2020-05-31',
        status: 'active',
        payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
      }).fetch()
    ).toJSON();

    MockDate.set(moment.tz('2020-05-31', 'Europe/Copenhagen'))
    await sails.helpers.populate.memberships.statusText([membership], i18n);

    expect(membership).to.matchPattern(`{
      client: ${testClientId},
      membership_type: ${fixtures.membershipTypeYogaUnlimited.id},
      paid_until: '2020-05-31',
      status: 'active',
      status_text: 'Payment card missing.',
      ...
    }`);

    await Membership.destroy({id: membership.id});

  });

  it('should populate membership missing payment method and payment date exceeded', async () => {

    const membership = (
      await Membership.create({
        client: testClientId,
        membership_type: fixtures.membershipTypeYogaUnlimited.id,
        paid_until: '2020-05-31',
        status: 'active',
        payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
      }).fetch()
    ).toJSON();

    MockDate.set(moment.tz('2020-06-01', 'Europe/Copenhagen'))
    await sails.helpers.populate.memberships.statusText([membership], i18n);

    expect(membership).to.matchPattern(`{
      client: ${testClientId},
      membership_type: ${fixtures.membershipTypeYogaUnlimited.id},
      paid_until: '2020-05-31',
      status: 'active',
      status_text: 'Payment card missing. Payment date exceeded!',
      ...
    }`);

    await Membership.destroy({id: membership.id});

  });

  it('should populate membership with payment failed one time', async () => {

    const membership = (
      await Membership.create({
        client: testClientId,
        membership_type: fixtures.membershipTypeYogaUnlimited.id,
        paid_until: '2020-05-31',
        status: 'active',
        payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
        renewal_failed: 1,
      }).fetch()
    ).toJSON();

    const paymentSubscription = await PaymentSubscription.create({
      membership: membership.id,
      status: 'active'
    }).fetch();

    MockDate.set(moment.tz('2020-06-01', 'Europe/Copenhagen'))
    await sails.helpers.populate.memberships.statusText([membership], i18n);

    expect(membership).to.matchPattern(`{
      client: ${testClientId},
      membership_type: ${fixtures.membershipTypeYogaUnlimited.id},
      paid_until: '2020-05-31',
      status: 'active',
      status_text: 'Automatic renewal failed 1 time.',
      renewal_failed: 1,
      ...
    }`);

    await Membership.destroy({id: membership.id});
    await PaymentSubscription.destroy({id: paymentSubscription.id});

  });

  it('should populate membership with payment failed two times', async () => {

    const membership = (
      await Membership.create({
        client: testClientId,
        membership_type: fixtures.membershipTypeYogaUnlimited.id,
        paid_until: '2020-05-31',
        status: 'active',
        payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
        renewal_failed: 2,
      }).fetch()
    ).toJSON();

    const paymentSubscription = await PaymentSubscription.create({
      membership: membership.id,
      status: 'active'
    }).fetch();

    MockDate.set(moment.tz('2020-06-01', 'Europe/Copenhagen'))
    await sails.helpers.populate.memberships.statusText([membership], i18n);

    expect(membership).to.matchPattern(`{
      client: ${testClientId},
      membership_type: ${fixtures.membershipTypeYogaUnlimited.id},
      paid_until: '2020-05-31',
      status: 'active',
      status_text: 'Automatic renewal failed 2 times.',
      renewal_failed: 2,
      ...
    }`);

    await Membership.destroy({id: membership.id});
    await PaymentSubscription.destroy({id: paymentSubscription.id});

  });

  it('should populate paused membership with no payment methods', async () => {

    const membership = (
      await Membership.create({
        client: testClientId,
        membership_type: fixtures.membershipTypeYogaUnlimited.id,
        paid_until: '2020-05-31',
        status: 'active',
        payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
      }).fetch()
    ).toJSON();

    const membershipPause = await MembershipPause.create({
      client_id: testClientId,
      membership_id: membership.id,
      start_date: '2020-05-20',
    }).fetch();


    MockDate.set(moment.tz('2020-05-31', 'Europe/Copenhagen'))
    await sails.helpers.populate.memberships.statusText([membership], i18n);

    expect(membership).to.matchPattern(`{
      client: ${testClientId},
      membership_type: ${fixtures.membershipTypeYogaUnlimited.id},
      paid_until: '2020-05-31',
      status: 'active',
      status_text: 'Paused. Payment card missing.',
      ...
    }`);

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: membershipPause.id});

  });

  it('should populate paused membership with no payment methods and payment date exceeded', async () => {

    const membership = (
      await Membership.create({
        client: testClientId,
        membership_type: fixtures.membershipTypeYogaUnlimited.id,
        paid_until: '2020-05-31',
        status: 'active',
        payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
      }).fetch()
    ).toJSON();

    const membershipPause = await MembershipPause.create({
      client_id: testClientId,
      membership_id: membership.id,
      start_date: '2020-06-05',
    }).fetch();

    MockDate.set(moment.tz('2020-06-10', 'Europe/Copenhagen'))
    await sails.helpers.populate.memberships.statusText([membership], i18n);

    expect(membership).to.matchPattern(`{
      client: ${testClientId},
      membership_type: ${fixtures.membershipTypeYogaUnlimited.id},
      paid_until: '2020-05-31',
      status: 'active',
      status_text: 'Paused. Payment card missing. Payment date exceeded!',
      ...
    }`);

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: membershipPause.id});

  });

  it('should populate paused membership with payment failed one time', async () => {

    const membership = (
      await Membership.create({
        client: testClientId,
        membership_type: fixtures.membershipTypeYogaUnlimited.id,
        paid_until: '2020-05-31',
        status: 'active',
        payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
        renewal_failed: 1,
      }).fetch()
    ).toJSON();

    const paymentSubscription = await PaymentSubscription.create({
      membership: membership.id,
      status: 'active'
    }).fetch();

    const membershipPause = await MembershipPause.create({
      client_id: testClientId,
      membership_id: membership.id,
      start_date: '2020-06-02',
    }).fetch();


    MockDate.set(moment.tz('2020-06-02', 'Europe/Copenhagen'))
    await sails.helpers.populate.memberships.statusText([membership], i18n);

    expect(membership).to.matchPattern(`{
      client: ${testClientId},
      membership_type: ${fixtures.membershipTypeYogaUnlimited.id},
      paid_until: '2020-05-31',
      status: 'active',
      status_text: 'Paused. Automatic renewal failed 1 time.',
      renewal_failed: 1,
      ...
    }`);

    await Membership.destroy({id: membership.id});
    await PaymentSubscription.destroy({id: paymentSubscription.id});
    await MembershipPause.destroy({id: membershipPause.id});

  });

  it('should populate paused membership with payment failed two times', async () => {

    const membership = (
      await Membership.create({
        client: testClientId,
        membership_type: fixtures.membershipTypeYogaUnlimited.id,
        paid_until: '2020-05-31',
        status: 'active',
        payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
        renewal_failed: 2,
      }).fetch()
    ).toJSON();

    const paymentSubscription = await PaymentSubscription.create({
      membership: membership.id,
      status: 'active'
    }).fetch();

    const membershipPause = await MembershipPause.create({
      client_id: testClientId,
      membership_id: membership.id,
      start_date: '2020-06-02',
    }).fetch();

    MockDate.set(moment.tz('2020-06-02', 'Europe/Copenhagen'))
    await sails.helpers.populate.memberships.statusText([membership], i18n);

    expect(membership).to.matchPattern(`{
      client: ${testClientId},
      membership_type: ${fixtures.membershipTypeYogaUnlimited.id},
      paid_until: '2020-05-31',
      status: 'active',
      status_text: 'Paused. Automatic renewal failed 2 times.',
      renewal_failed: 2,
      ...
    }`);

    await Membership.destroy({id: membership.id});
    await PaymentSubscription.destroy({id: paymentSubscription.id});
    await MembershipPause.destroy({id: membershipPause.id});

  });

  it('should populate membership that is cancelled and running', async () => {

    const membership = (
      await Membership.create({
        client: testClientId,
        membership_type: fixtures.membershipTypeYogaUnlimited.id,
        paid_until: '2020-05-31',
        status: 'cancelled_running',
        cancelled_from_date: '2020-07-01',
        payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
      }).fetch()
    ).toJSON();

    const paymentSubscription = await PaymentSubscription.create({
      membership: membership.id,
      status: 'active'
    }).fetch();

    MockDate.set(moment.tz('2020-05-31', 'Europe/Copenhagen'))
    await sails.helpers.populate.memberships.statusText([membership], i18n);

    expect(membership).to.matchPattern(`{
      client: ${testClientId},
      membership_type: ${fixtures.membershipTypeYogaUnlimited.id},
      paid_until: '2020-05-31',
      status: 'cancelled_running',
      status_text: 'Terminated from Wednesday, July 1, 2020.',      
      ...
    }`);

    await Membership.destroy({id: membership.id});
    await PaymentSubscription.destroy({id: paymentSubscription.id});

  });

  it('should populate membership that is cancelled and running with no payment cards', async () => {

    const membership = (
      await Membership.create({
        client: testClientId,
        membership_type: fixtures.membershipTypeYogaUnlimited.id,
        paid_until: '2020-05-31',
        status: 'cancelled_running',
        cancelled_from_date: '2020-07-01',
        payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
      }).fetch()
    ).toJSON();

    MockDate.set(moment.tz('2020-05-31', 'Europe/Copenhagen'))
    await sails.helpers.populate.memberships.statusText([membership], i18n);

    expect(membership).to.matchPattern(`{
      client: ${testClientId},
      membership_type: ${fixtures.membershipTypeYogaUnlimited.id},
      paid_until: '2020-05-31',
      status: 'cancelled_running',
      status_text: 'Terminated from Wednesday, July 1, 2020. Payment card missing.',      
      ...
    }`);

    await Membership.destroy({id: membership.id});

  });

  it('should populate membership that is cancelled and running, has no payment cards and payment date is exceeded', async () => {

    const membership = (
      await Membership.create({
        client: testClientId,
        membership_type: fixtures.membershipTypeYogaUnlimited.id,
        paid_until: '2020-05-31',
        status: 'cancelled_running',
        cancelled_from_date: '2020-07-01',
        payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
      }).fetch()
    ).toJSON();

    MockDate.set(moment.tz('2020-06-01', 'Europe/Copenhagen'))
    await sails.helpers.populate.memberships.statusText([membership], i18n);

    expect(membership).to.matchPattern(`{
      client: ${testClientId},
      membership_type: ${fixtures.membershipTypeYogaUnlimited.id},
      paid_until: '2020-05-31',
      status: 'cancelled_running',
      status_text: 'Terminated from Wednesday, July 1, 2020. Payment card missing. Payment date exceeded!',      
      ...
    }`);

    await Membership.destroy({id: membership.id});

  });

  it('should populate membership that is cancelled and running, and where payment failed one time', async () => {

    const membership = (
      await Membership.create({
        client: testClientId,
        membership_type: fixtures.membershipTypeYogaUnlimited.id,
        paid_until: '2020-05-31',
        status: 'cancelled_running',
        cancelled_from_date: '2020-07-01',
        payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
        renewal_failed: 1,
      }).fetch()
    ).toJSON();

    const paymentSubscription = await PaymentSubscription.create({
      membership: membership.id,
      status: 'active'
    }).fetch();

    MockDate.set(moment.tz('2020-06-01', 'Europe/Copenhagen'))
    await sails.helpers.populate.memberships.statusText([membership], i18n);

    expect(membership).to.matchPattern(`{
      client: ${testClientId},
      membership_type: ${fixtures.membershipTypeYogaUnlimited.id},
      paid_until: '2020-05-31',
      status: 'cancelled_running',
      status_text: 'Terminated from Wednesday, July 1, 2020. Automatic renewal failed 1 time.',      
      ...
    }`);

    await Membership.destroy({id: membership.id});
    await PaymentSubscription.destroy({id: paymentSubscription.id});

  });

  it('should populate membership that is cancelled and running, and where payment failed two times', async () => {

    const membership = (
      await Membership.create({
        client: testClientId,
        membership_type: fixtures.membershipTypeYogaUnlimited.id,
        paid_until: '2020-05-31',
        status: 'cancelled_running',
        cancelled_from_date: '2020-07-01',
        payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
        renewal_failed: 2,
      }).fetch()
    ).toJSON();

    const paymentSubscription = await PaymentSubscription.create({
      membership: membership.id,
      status: 'active'
    }).fetch();

    MockDate.set(moment.tz('2020-06-01', 'Europe/Copenhagen'))
    await sails.helpers.populate.memberships.statusText([membership], i18n);

    expect(membership).to.matchPattern(`{
      client: ${testClientId},
      membership_type: ${fixtures.membershipTypeYogaUnlimited.id},
      paid_until: '2020-05-31',
      status: 'cancelled_running',
      status_text: 'Terminated from Wednesday, July 1, 2020. Automatic renewal failed 2 times.',      
      ...
    }`);

    await Membership.destroy({id: membership.id});
    await PaymentSubscription.destroy({id: paymentSubscription.id});

  });

  it('should populate membership that is terminated', async () => {

    const membership = (
      await Membership.create({
        client: testClientId,
        membership_type: fixtures.membershipTypeYogaUnlimited.id,
        paid_until: '2020-05-31',
        status: 'ended',
        payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
      }).fetch()
    ).toJSON();

    const paymentSubscription = await PaymentSubscription.create({
      membership: membership.id,
      status: 'active'
    }).fetch();

    MockDate.set(moment.tz('2020-06-01', 'Europe/Copenhagen'))
    await sails.helpers.populate.memberships.statusText([membership], i18n);

    expect(membership).to.matchPattern(`{
      client: ${testClientId},
      membership_type: ${fixtures.membershipTypeYogaUnlimited.id},
      paid_until: '2020-05-31',
      status_text: 'Stopped.',      
      ...
    }`);

    await Membership.destroy({id: membership.id});
    await PaymentSubscription.destroy({id: paymentSubscription.id});

  });


});
