const assert = require('assert');
const moment = require('moment-timezone');

const testClientId = require('../../../../global-test-variables').TEST_CLIENT_ID;
const fixtures = require('../../../../fixtures/factory').fixtures;

const MockDate = require('mockdate');
const sinon = require('sinon');

describe('helpers.memberships.find-one.that-needs-to-process-payment', async () => {

  let memberships;

  before(async () => {

    MockDate.set(moment.tz('2019-05-16 12:00:00', 'Europe/Copenhagen'));

    // Just a membership to fill the db
    await Membership.destroy({});
    memberships = await Membership.createEach([
      {
        user: fixtures.userAlice.id,
        paid_until: '2019-05-16',
        client: testClientId,
        status: 'active',
      },
    ]).fetch();

  });

  after(async () => {

    MockDate.reset();
    await Membership.destroy({
      id: _.map(memberships, 'id'),
    });
  });


  it('should return false is no memberships need processing', async () => {
    assert.strictEqual(
      await sails.helpers.memberships.findOne.thatNeedsToProcessPayment(),
      false,
    );
  });


  it('should find an active membership where paid_until is passed', async () => {

    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2019-05-15',
      client: testClientId,
      status: 'active',
    }).fetch();

    assert.strictEqual(
      (await sails.helpers.memberships.findOne.thatNeedsToProcessPayment()).id,
      membership.id,
    );

    await Membership.destroy({id: membership.id});

  });

  it('should return false if client has "pause_automatic_membership_payments" set to true', async () => {

    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2019-05-15',
      client: testClientId,
      status: 'active',
    }).fetch();

    const settingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'pause_automatic_membership_payments',
      value: 1,
    }).fetch();

    assert.strictEqual(
      await sails.helpers.memberships.findOne.thatNeedsToProcessPayment(),
      false,
    );

    await Membership.destroy({id: membership.id});
    await ClientSettings.destroy({id: settingsRow.id});

  });

  it('should return an active membership if another client has "pause_automatic_membership_payments" set to true', async () => {

    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2019-05-15',
      client: testClientId,
      status: 'active',
    }).fetch();

    const settingsRow = await ClientSettings.create({
      client: testClientId + 1,
      key: 'pause_automatic_membership_payments',
      value: 1,
    }).fetch();

    assert.strictEqual(
      (await sails.helpers.memberships.findOne.thatNeedsToProcessPayment()).id,
      membership.id,
    );

    await Membership.destroy({id: membership.id});
    await ClientSettings.destroy({id: settingsRow.id});

  });


  it('should NOT find an active membership where renewal failed once and less than 3 days have passed', async () => {
    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2019-05-15',
      client: testClientId,
      renewal_failed: 1,
      status: 'active',
    }).fetch();

    assert.strictEqual(
      await sails.helpers.memberships.findOne.thatNeedsToProcessPayment(),
      false,
    );

    await Membership.destroy({id: membership.id});
  });

  it('should find an active membership where renewal failed once and 3 days (default) have passed', async () => {
    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2019-05-12',
      client: testClientId,
      renewal_failed: 1,
      status: 'active',
    }).fetch();

    assert.strictEqual(
      (await sails.helpers.memberships.findOne.thatNeedsToProcessPayment()).id,
      membership.id,
    );

    await Membership.destroy({id: membership.id});
  });

  it('should NOT find an active membership where renewal failed twice and less than 6 days (default) have passed', async () => {
    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2019-05-10',
      client: testClientId,
      renewal_failed: 2,
      status: 'active',
    }).fetch();

    assert.strictEqual(
      await sails.helpers.memberships.findOne.thatNeedsToProcessPayment(),
      false,
    );

    await Membership.destroy({id: membership.id});
  });

  it('should find an active membership where renewal failed twice and 6 days (default) have passed', async () => {
    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2019-05-09',
      client: testClientId,
      renewal_failed: 2,
      status: 'active',
      renewal_failed_last_time_at: moment.tz('2019-05-15 11:30:00', 'Europe/Copenhagen').format('x'),
    }).fetch();

    assert.strictEqual(
      (await sails.helpers.memberships.findOne.thatNeedsToProcessPayment()).id,
      membership.id,
    );

    await Membership.destroy({id: membership.id});
  });

  it('should NOT find an active membership where renewal failed twice and 6 days have passed, but it is less than 24 hours since last try', async () => {
    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2019-05-09',
      client: testClientId,
      renewal_failed: 2,
      status: 'active',
      renewal_failed_last_time_at: moment.tz('2019-05-15 12:30:00', 'Europe/Copenhagen').format('x'),
    }).fetch();

    assert.strictEqual(
      await sails.helpers.memberships.findOne.thatNeedsToProcessPayment(),
      false,
    );

    await Membership.destroy({id: membership.id});
  });

  it('should find an active membership where renewal failed 3 times and 9 days (default) have passed', async () => {
    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2019-05-06',
      client: testClientId,
      renewal_failed: 3,
      status: 'active',
    }).fetch();

    assert.strictEqual(
      (await sails.helpers.memberships.findOne.thatNeedsToProcessPayment()).id,
      membership.id,
    );

    await Membership.destroy({id: membership.id});
  });

  it('should NOT find an active membership where renewal failed 4 times and less than 10 days (default) have passed', async () => {
    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2019-05-06',
      client: testClientId,
      renewal_failed: 4,
      status: 'active',
    }).fetch();

    assert.strictEqual(
      await sails.helpers.memberships.findOne.thatNeedsToProcessPayment(),
      false,
    );

    await Membership.destroy({id: membership.id});
  });

  it('should find an active membership where renewal failed 4 times and 10 days (default) have passed', async () => {
    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2019-05-05',
      client: testClientId,
      renewal_failed: 4,
      status: 'active',
    }).fetch();

    assert.strictEqual(
      (await sails.helpers.memberships.findOne.thatNeedsToProcessPayment()).id,
      membership.id,
    );

    await Membership.destroy({id: membership.id});
  });

  it('should NOT find an active membership where renewal failed 5 times and is ended', async () => {
    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2019-05-02',
      client: testClientId,
      renewal_failed: 5,
      status: 'ended',
    }).fetch();

    assert.strictEqual(
      await sails.helpers.memberships.findOne.thatNeedsToProcessPayment(),
      false,
    );

    await Membership.destroy({id: membership.id});
  });

  it('should find an active membership that has failed 5 times or more (if the client recently lowered the fail count)', async () => {
    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2019-05-05',
      client: testClientId,
      renewal_failed: 5,
      status: 'active',
    }).fetch();

    assert.strictEqual(
      (await sails.helpers.memberships.findOne.thatNeedsToProcessPayment()).id,
      membership.id,
    );

    await Membership.destroy({id: membership.id});
  });

  it('should find a cancelled_running membership', async () => {
    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2019-05-04',
      cancelled_from_date: '2019-06-05',
      client: testClientId,
      renewal_failed: 0,
      status: 'cancelled_running',
    }).fetch();

    assert.strictEqual(
      (await sails.helpers.memberships.findOne.thatNeedsToProcessPayment()).id,
      membership.id,
    );

    await Membership.destroy({id: membership.id});
  });

  it('should NOT find an ended membership', async () => {
    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2019-03-01',
      client: testClientId,
      status: 'ended',
    }).fetch();

    assert.strictEqual(
      await sails.helpers.memberships.findOne.thatNeedsToProcessPayment(),
      false,
    );

    await Membership.destroy({id: membership.id});
  });

  it('should NOT find an archived membership', async () => {
    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2019-05-15',
      client: testClientId,
      status: 'active',
      archived: true,
    }).fetch();

    assert.strictEqual(
      await sails.helpers.memberships.findOne.thatNeedsToProcessPayment(),
      false,
    );

    await Membership.destroy({id: membership.id});
  });

  it('should NOT find a membership that has been cancelled and is expired', async () => {
    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2019-05-15',
      client: testClientId,
      status: 'cancelled_running',
      cancelled_from_date: '2019-05-16',
      archived: false,
    }).fetch();

    assert.strictEqual(
      await sails.helpers.memberships.findOne.thatNeedsToProcessPayment(),
      false,
    );

    await Membership.destroy({id: membership.id});
  });

  it('should NOT find a membership that is already being processed', async () => {
    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2019-05-15',
      client: testClientId,
      status: 'active',
      automatic_payment_processing_started: '123456789',
    }).fetch();

    assert.strictEqual(
      await sails.helpers.memberships.findOne.thatNeedsToProcessPayment(),
      false,
    );

    await Membership.destroy({id: membership.id});
  });

  it('should only load clientSettings once for each client', async () => {

    const getClientSettingsFake = sinon.fake.returns({
      'membership_number_of_failed_payment_attempts_before_termination': 5,
      'membership_payment_failed_days_before_attempt_2': 3,
      'membership_payment_failed_days_before_attempt_3': 3,
      'membership_payment_failed_days_before_attempt_4': 3,
      'membership_payment_failed_days_before_attempt_5': 1,
    });

    sinon.replace(sails.helpers.clientSettings, 'find', getClientSettingsFake);

    const memberships = await Membership.createEach([
      {
        user: fixtures.userAlice.id,
        paid_until: '2019-05-15',
        client: testClientId,
        renewal_failed: 1,
        status: 'active',
      },
      {
        user: fixtures.userAlice.id,
        paid_until: '2019-05-15',
        client: testClientId,
        renewal_failed: 1,
        status: 'active',
      },
      {
        user: fixtures.userAlice.id,
        paid_until: '2019-05-15',
        client: testClientId + 1,
        renewal_failed: 1,
        status: 'active',
      },
    ]).fetch();

    await sails.helpers.memberships.findOne.thatNeedsToProcessPayment();
    assert.strictEqual(getClientSettingsFake.callCount, 2);
    
    assert.strictEqual(getClientSettingsFake.firstCall.args[0], testClientId);
    assert.strictEqual(getClientSettingsFake.secondCall.args[0], testClientId + 1);


    await Membership.destroy({id: _.map(memberships, 'id')});

    sinon.restore();

  });

  it('should NOT find a membership that is paused with an end date', async () => {

    const membership = await Membership.create(
      {
        user: fixtures.userAlice.id,
        paid_until: '2019-05-15',
        client: testClientId,
        status: 'active',
      },
    ).fetch();

    const membershipPause = await MembershipPause.create({
      client_id: testClientId,
      membership_id: membership.id,
      start_date: '2019-05-16',
      end_date:'2019-05-17'
    }).fetch();

    const membershipThatNeedsPayment = await sails.helpers.memberships.findOne.thatNeedsToProcessPayment();
    assert.strictEqual(
      membershipThatNeedsPayment,
      false,
    );

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: membershipPause.id});

    sinon.restore();

  });

  it('should NOT find a membership that is paused without end date', async () => {

    const membership = await Membership.create(
      {
        user: fixtures.userAlice.id,
        paid_until: '2019-05-15',
        client: testClientId,
        status: 'active',
      },
    ).fetch();

    const membershipPause = await MembershipPause.create({
      client_id: testClientId,
      membership_id: membership.id,
      start_date: '2019-05-16',
    }).fetch();

    const membershipThatNeedsPayment = await sails.helpers.memberships.findOne.thatNeedsToProcessPayment();
    assert.strictEqual(
      membershipThatNeedsPayment,
      false,
    );

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: membershipPause.id});

    sinon.restore();

  });

  it('should find a membership with no mambership pauses covering today', async () => {

    const membership = await Membership.create(
      {
        user: fixtures.userAlice.id,
        paid_until: '2019-05-15',
        client: testClientId,
        status: 'active',
      },
    ).fetch();

    const membershipPauses = await MembershipPause.createEach([
      {
      client_id: testClientId,
      membership_id: membership.id,
      start_date: '2019-05-15',
      end_date:'2019-05-16'
    }, {
      client_id: testClientId,
      membership_id: membership.id,
      start_date: '2019-05-17',
      end_date: '2019-05-18'
    }
  ]).fetch();

    const membershipThatNeedsPayment = await sails.helpers.memberships.findOne.thatNeedsToProcessPayment();
    expect(membershipThatNeedsPayment).to.matchPattern(`{
      id: ${membership.id},
      ...
    }`);

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: _.map(membershipPauses, 'id')});

    sinon.restore();

  });

});
