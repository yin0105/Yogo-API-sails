const moment = require('moment-timezone');

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID;
const fixtures = require('../../../fixtures/factory').fixtures;

const MockDate = require('mockdate');

describe('helpers.memberships.check-for-ended-pauses-and-push-dates', async function () {

  before(async () => {
    await MembershipLog.destroy({});
  });

  afterEach(async () => {
    await MembershipLog.destroy({});
  });

  it('should update a membership that has an expired, non-applied membership pause', async () => {

    const membership = await Membership.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      paid_until: '2020-04-30',
      status: 'active',
    }).fetch();

    const membershipPause = await MembershipPause.create({
      client_id: testClientId,
      membership_id: membership.id,
      start_date: '2020-05-01',
      end_date: '2020-06-01',
    }).fetch();

    MockDate.set(moment.tz('2020-06-01 00:00:00', 'Europe/Copenhagen'));
    const timestampBeforeCall = Date.now();
    await sails.helpers.memberships.checkForEndedPausesAndPushDates(membership);
    const timestampAfterCall = Date.now();

    const updatedMembership = await Membership.findOne(membership.id);

    expect(updatedMembership.toJSON()).to.matchPattern(`{
      id: ${membership.id},
      client: ${testClientId},
      user: ${fixtures.userAlice.id},
      membership_type: ${fixtures.membershipTypeYogaUnlimited.id},
      paid_until: '2020-05-31',      
      ...
    }`);


    const updatedMembershipPause = await MembershipPause.findOne(membershipPause.id);
    expect(updatedMembershipPause).to.matchPattern(`{
      id: ${membershipPause.id},
      is_applied_to_membership_at: _.isBetween|${timestampBeforeCall - 1}|${timestampAfterCall +1},
      ...
    }`);

    const membershipLogEntries = await MembershipLog.find();
    expect(membershipLogEntries).to.matchPattern(`[
      {
        client: ${testClientId},
        membership: ${membership.id},
        entry: 'Membership pause ended. Payment date changed from Friday, May 1, 2020 to Monday, June 1, 2020.',
        ... 
      }
    ]`);

    MockDate.reset();

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: membershipPause.id});

  });

  it('should do nothing if the pause is not over yet', async () => {

    const membership = await Membership.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      paid_until: '2020-04-30',
      status: 'active',
    }).fetch();

    const membershipPause = await MembershipPause.create({
      client_id: testClientId,
      membership_id: membership.id,
      start_date: '2020-05-01',
      end_date: '2020-06-01',
    }).fetch();

    MockDate.set(moment.tz('2020-05-31 23:59:59', 'Europe/Copenhagen'));
    await sails.helpers.memberships.checkForEndedPausesAndPushDates(membership);

    const updatedMembership = await Membership.findOne(membership.id);

    expect(updatedMembership.toJSON()).to.matchPattern(`{
      id: ${membership.id},
      client: ${testClientId},
      user: ${fixtures.userAlice.id},
      membership_type: ${fixtures.membershipTypeYogaUnlimited.id},
      paid_until: '2020-04-30',
      ...
    }`);

    const updatedMembershipPause = await MembershipPause.findOne(membershipPause.id);
    expect(updatedMembershipPause).to.matchPattern(`{
      id: ${membershipPause.id},
      is_applied_to_membership_at: 0,
      ...
    }`);

    const membershipLogEntries = await MembershipLog.find();
    expect(membershipLogEntries).to.matchPattern(`[]`);

    MockDate.reset();

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: membershipPause.id});

  });

  it('should do nothing if pause is already applied', async () => {

    const membership = await Membership.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      paid_until: '2020-05-31',
      status: 'active',
    }).fetch();

    const membershipPause = await MembershipPause.create({
      client_id: testClientId,
      membership_id: membership.id,
      start_date: '2020-05-01',
      end_date: '2020-06-01',
      is_applied_to_membership_at: 1234567890,
    }).fetch();

    MockDate.set(moment.tz('2020-06-01 00:00:00', 'Europe/Copenhagen'));
    await sails.helpers.memberships.checkForEndedPausesAndPushDates(membership);

    const updatedMembership = await Membership.findOne(membership.id);

    expect(updatedMembership.toJSON()).to.matchPattern(`{
      id: ${membership.id},
      client: ${testClientId},
      user: ${fixtures.userAlice.id},
      membership_type: ${fixtures.membershipTypeYogaUnlimited.id},
      paid_until: '2020-05-31',
      ...
    }`);

    const updatedMembershipPause = await MembershipPause.findOne(membershipPause.id);
    expect(updatedMembershipPause).to.matchPattern(`{
      id: ${membershipPause.id},
      is_applied_to_membership_at: 1234567890,
      ...
    }`);

    const membershipLogEntries = await MembershipLog.find();
    expect(membershipLogEntries).to.matchPattern(`[]`);

    MockDate.reset();

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: membershipPause.id});

  });

  it('should disregard archived pause', async () => {

    const membership = await Membership.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      paid_until: '2020-04-30',
      status: 'active',
    }).fetch();

    const membershipPause = await MembershipPause.create({
      client_id: testClientId,
      membership_id: membership.id,
      start_date: '2020-05-01',
      end_date: '2020-06-01',
      archived: 1,
    }).fetch();

    MockDate.set(moment.tz('2020-06-01 00:00:00', 'Europe/Copenhagen'));
    await sails.helpers.memberships.checkForEndedPausesAndPushDates(membership);

    const updatedMembership = await Membership.findOne(membership.id);

    expect(updatedMembership.toJSON()).to.matchPattern(`{
      id: ${membership.id},
      client: ${testClientId},
      user: ${fixtures.userAlice.id},
      membership_type: ${fixtures.membershipTypeYogaUnlimited.id},
      paid_until: '2020-04-30',
      ...
    }`);

    const updatedMembershipPause = await MembershipPause.findOne(membershipPause.id);
    expect(updatedMembershipPause).to.matchPattern(`{
      id: ${membershipPause.id},
      is_applied_to_membership_at: 0,
      archived: true,
      ...
    }`);

    const membershipLogEntries = await MembershipLog.find();
    expect(membershipLogEntries).to.matchPattern(`[]`);

    MockDate.reset();

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: membershipPause.id});

  });

  it('should disregard upcoming, archived pauses', async () => {

    const membership = await Membership.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      paid_until: '2020-04-30',
      status: 'active',
    }).fetch();

    const membershipPauses = await MembershipPause.createEach([
      {
        client_id: testClientId,
        membership_id: membership.id,
        start_date: '2020-05-01',
        end_date: '2020-06-01',
      },
      {
        client_id: testClientId,
        membership_id: membership.id,
        start_date: '2020-05-02',
        end_date: '2020-06-02',
        archived: 1,
      },
    ]).fetch();

    MockDate.set(moment.tz('2020-06-01 00:00:00', 'Europe/Copenhagen'));
    const timestampBeforeCall = Date.now();
    await sails.helpers.memberships.checkForEndedPausesAndPushDates(membership);
    const timestampAfterCall = Date.now();

    const updatedMembership = await Membership.findOne(membership.id);

    expect(updatedMembership.toJSON()).to.matchPattern(`{
      id: ${membership.id},
      client: ${testClientId},
      user: ${fixtures.userAlice.id},
      membership_type: ${fixtures.membershipTypeYogaUnlimited.id},
      paid_until: '2020-05-31',      
      ...
    }`);


    const updatedMembershipPauses = await MembershipPause.find({id: _.map(membershipPauses, 'id')});
    expect(updatedMembershipPauses).to.matchPattern(`[{
      id: ${membershipPauses[0].id},
      is_applied_to_membership_at: _.isBetween|${timestampBeforeCall - 1}|${timestampAfterCall +1},
      archived: false,
      ...
    },
    {
      id: ${membershipPauses[1].id},
      is_applied_to_membership_at: 0,
      archived: true,
      ...
    }]`);

    const membershipLogEntries = await MembershipLog.find();
    expect(membershipLogEntries).to.matchPattern(`[
      {
        client: ${testClientId},
        membership: ${membership.id},
        entry: 'Membership pause ended. Payment date changed from Friday, May 1, 2020 to Monday, June 1, 2020.',
        ... 
      }
    ]`);

    MockDate.reset();

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: _.map(membershipPauses, 'id')});

  });

  it('should not process pause without end date', async () => {

    const membership = await Membership.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      paid_until: '2020-04-30',
      status: 'active',
    }).fetch();

    const membershipPauses = await MembershipPause.createEach([
      {
        client_id: testClientId,
        membership_id: membership.id,
        start_date: '2020-04-01',
        end_date: '2020-05-01',
      },
      {
        client_id: testClientId,
        membership_id: membership.id,
        start_date: '2020-05-01',
      },
    ]).fetch();

    MockDate.set(moment.tz('2020-06-01 00:00:00', 'Europe/Copenhagen'));
    await sails.helpers.memberships.checkForEndedPausesAndPushDates(membership);

    const updatedMembership = await Membership.findOne(membership.id);

    expect(updatedMembership.toJSON()).to.matchPattern(`{
      id: ${membership.id},
      client: ${testClientId},
      user: ${fixtures.userAlice.id},
      membership_type: ${fixtures.membershipTypeYogaUnlimited.id},
      paid_until: '2020-04-30',      
      ...
    }`);


    const updatedMembershipPauses = await MembershipPause.find({id: _.map(membershipPauses, 'id')});
    expect(updatedMembershipPauses).to.matchPattern(`[{
      id: ${membershipPauses[0].id},
      is_applied_to_membership_at: 0,
      ...
    },
    {
      id: ${membershipPauses[1].id},
      is_applied_to_membership_at: 0,
      ...
    }]`);

    const membershipLogEntries = await MembershipLog.find();
    expect(membershipLogEntries).to.matchPattern(`[]`);

    MockDate.reset();

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: _.map(membershipPauses, 'id')});

  });

  it('should handle multiple pauses on same membership', async () => {

    const membership = await Membership.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      paid_until: '2020-04-30',
      status: 'active',
    }).fetch();

    const membershipPauses = await MembershipPause.createEach(
      [
        {
          client_id: testClientId,
          membership_id: membership.id,
          start_date: '2020-03-01',
          end_date: '2020-04-01',
          is_applied_to_membership_at: 1234567890,
        },
        {
          client_id: testClientId,
          membership_id: membership.id,
          start_date: '2020-05-01',
          end_date: '2020-06-01',
          is_applied_to_membership_at: 0,
        },
      ],
    ).fetch();

    MockDate.set(moment.tz('2020-06-01 00:00:00', 'Europe/Copenhagen'));
    const timestampBeforeCall = Date.now();
    await sails.helpers.memberships.checkForEndedPausesAndPushDates(membership);
    const timestampAfterCall = Date.now();

    const updatedMembership = await Membership.findOne(membership.id);

    expect(updatedMembership.toJSON()).to.matchPattern(`{
      id: ${membership.id},
      client: ${testClientId},
      user: ${fixtures.userAlice.id},
      membership_type: ${fixtures.membershipTypeYogaUnlimited.id},
      paid_until: '2020-05-31',
      ...
    }`);

    const updatedMembershipPauses = await MembershipPause.find({id: _.map(membershipPauses, 'id')});
    expect(updatedMembershipPauses).to.matchPattern(`[{
      id: ${membershipPauses[0].id},
      is_applied_to_membership_at: 1234567890,
      ...
    },
    {
      id: ${membershipPauses[1].id},
      is_applied_to_membership_at: _.isBetween|${timestampBeforeCall - 1}|${timestampAfterCall +1},
      ...
    }]`);

    const membershipLogEntries = await MembershipLog.find();
    expect(membershipLogEntries).to.matchPattern(`[
      {
        client: ${testClientId},
        membership: ${membership.id},
        entry: 'Membership pause ended. Payment date changed from Friday, May 1, 2020 to Monday, June 1, 2020.',
        ... 
      }
    ]`);

    MockDate.reset();

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: _.map(membershipPauses, 'id')});

  });

  it('should handle multiple, already applied pauses on same membership', async () => {

    const membership = await Membership.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      paid_until: '2020-05-31',
      status: 'active',
    }).fetch();

    const membershipPauses = await MembershipPause.createEach(
      [
        {
          client_id: testClientId,
          membership_id: membership.id,
          start_date: '2020-03-01',
          end_date: '2020-04-01',
          is_applied_to_membership_at: 1234567890,
        },
        {
          client_id: testClientId,
          membership_id: membership.id,
          start_date: '2020-05-01',
          end_date: '2020-06-01',
          is_applied_to_membership_at: 1234567890,
        },
      ],
    ).fetch();

    MockDate.set(moment.tz('2020-06-01 00:00:00', 'Europe/Copenhagen'));
    await sails.helpers.memberships.checkForEndedPausesAndPushDates(membership);

    const updatedMembership = await Membership.findOne(membership.id);

    expect(updatedMembership.toJSON()).to.matchPattern(`{
      id: ${membership.id},
      client: ${testClientId},
      user: ${fixtures.userAlice.id},
      membership_type: ${fixtures.membershipTypeYogaUnlimited.id},
      paid_until: '2020-05-31',
      ...
    }`);

    const updatedMembershipPauses = await MembershipPause.find({id: _.map(membershipPauses, 'id')});
    expect(updatedMembershipPauses).to.matchPattern(`[{
      id: ${membershipPauses[0].id},
      is_applied_to_membership_at: 1234567890,
      ...
    },
    {
      id: ${membershipPauses[1].id},
      is_applied_to_membership_at: 1234567890,
      ...
    }]`);

    const membershipLogEntries = await MembershipLog.find();
    expect(membershipLogEntries).to.matchPattern(`[]`);

    MockDate.reset();

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: _.map(membershipPauses, 'id')});

  });

  it('should handle multiple memberships, on different clients with different locales', async () => {

    const clientSettingsRow = await ClientSettings.create({
      client: fixtures.testClient2.id,
      key: 'locale',
      value: 'da',
    }).fetch();

    const memberships = await Membership.createEach(
      [
        {
          client: testClientId,
          paid_until: '2020-04-30',
          status: 'active',
          user: fixtures.userAlice.id,
        },
        {
          client: fixtures.testClient2.id,
          paid_until: '2020-04-30',
          status: 'active',
          user: fixtures.userAlice.id,
        },
      ],
    ).fetch();

    const membershipPauses = await MembershipPause.createEach(
      [
        {
          client_id: testClientId,
          membership_id: memberships[0].id,
          start_date: '2020-03-01',
          end_date: '2020-04-01',
          is_applied_to_membership_at: 1234567890,
        },
        {
          client_id: testClientId,
          membership_id: memberships[0].id,
          start_date: '2020-05-01',
          end_date: '2020-06-01',
          is_applied_to_membership_at: 0,
        },
        {
          client_id: fixtures.testClient2.id,
          membership_id: memberships[1].id,
          start_date: '2020-03-01',
          end_date: '2020-04-01',
          is_applied_to_membership_at: 1234567890,
        },
        {
          client_id: fixtures.testClient2.id,
          membership_id: memberships[1].id,
          start_date: '2020-05-01',
          end_date: '2020-06-01',
          is_applied_to_membership_at: 0,
        },
      ],
    ).fetch();

    MockDate.set(moment.tz('2020-06-01 00:00:00', 'Europe/Copenhagen'));
    const timestampBeforeCall = Date.now();
    await sails.helpers.memberships.checkForEndedPausesAndPushDates(memberships);
    const timestampAfterCall = Date.now();

    const MembershipObjection = require('../../../../api/objection-models/Membership');
    const updatedMemberships = await MembershipObjection.query()
      .where('id', 'in', _.map(memberships, 'id'));

    expect(_.sortBy(updatedMemberships, 'client')).to.matchPattern(`[
    {
      id: ${memberships[0].id},
      client: ${testClientId},
      paid_until: '2020-05-31',
      ...
    },
    {
      id: ${memberships[1].id},
      client: ${fixtures.testClient2.id},
      paid_until: '2020-05-31',
      ...
    }]`);

    const updatedMembershipPauses = await MembershipPause.find({id: _.map(membershipPauses, 'id')});
    expect(updatedMembershipPauses).to.matchPattern(`[
    {
      id: ${membershipPauses[0].id},
      is_applied_to_membership_at: 1234567890,
      ...
    },
    {
      id: ${membershipPauses[1].id},
      is_applied_to_membership_at: _.isBetween|${timestampBeforeCall - 1}|${timestampAfterCall +1},
      ...
    },
    {
      id: ${membershipPauses[2].id},
      is_applied_to_membership_at: 1234567890,
      ...
    },
    {
      id: ${membershipPauses[3].id},
      is_applied_to_membership_at: _.isBetween|${timestampBeforeCall - 1}|${timestampAfterCall +1},
      ...
    }
    ]`);

    const membershipLogEntries = await MembershipLog.find();
    expect(membershipLogEntries).to.matchPattern(`[
      {
        client: ${testClientId},
        membership: ${memberships[0].id},
        entry: 'Membership pause ended. Payment date changed from Friday, May 1, 2020 to Monday, June 1, 2020.',
        ... 
      },
      {
        client: ${fixtures.testClient2.id},
        membership: ${memberships[1].id},
        entry: 'Bero afsluttet. Betalingsdato ændret fra fredag d. 1. maj 2020 til mandag d. 1. juni 2020.',
        ... 
      }
    ]`);

    MockDate.reset();

    await Membership.destroy({id: _.map(memberships, 'id')});
    await MembershipPause.destroy({id: _.map(membershipPauses, 'id')});
    await ClientSettings.destroy({id: clientSettingsRow.id});

  });

  it('should handle multiple simultaneous calls', async () => {

    const clientSettingsRow = await ClientSettings.create({
      client: fixtures.testClient2.id,
      key: 'locale',
      value: 'da',
    }).fetch();

    const memberships = await Membership.createEach(
      [
        {
          client: testClientId,
          paid_until: '2020-04-30',
          status: 'active',
          user: fixtures.userAlice.id,
        },
        {
          client: fixtures.testClient2.id,
          paid_until: '2020-04-30',
          status: 'active',
          user: fixtures.userAlice.id,
        },
      ],
    ).fetch();

    const membershipPauses = await MembershipPause.createEach(
      [
        {
          client_id: testClientId,
          membership_id: memberships[0].id,
          start_date: '2020-03-01',
          end_date: '2020-04-01',
          is_applied_to_membership_at: 1234567890,
        },
        {
          client_id: testClientId,
          membership_id: memberships[0].id,
          start_date: '2020-05-01',
          end_date: '2020-06-01',
          is_applied_to_membership_at: 0,
        },
        {
          client_id: fixtures.testClient2.id,
          membership_id: memberships[1].id,
          start_date: '2020-03-01',
          end_date: '2020-04-01',
          is_applied_to_membership_at: 1234567890,
        },
        {
          client_id: fixtures.testClient2.id,
          membership_id: memberships[1].id,
          start_date: '2020-05-01',
          end_date: '2020-06-01',
          is_applied_to_membership_at: 0,
        },
      ],
    ).fetch();

    MockDate.set(moment.tz('2020-06-01 00:00:00', 'Europe/Copenhagen'));
    const timestampBeforeCall = Date.now();
    await Promise.all([
      sails.helpers.memberships.checkForEndedPausesAndPushDates(memberships),
      sails.helpers.memberships.checkForEndedPausesAndPushDates(memberships),
      sails.helpers.memberships.checkForEndedPausesAndPushDates(memberships),
    ]);
    const timestampAfterCall = Date.now();

    const MembershipObjection = require('../../../../api/objection-models/Membership');
    const updatedMemberships = await MembershipObjection.query()
      .where('id', 'in', _.map(memberships, 'id'));

    expect(_.sortBy(updatedMemberships, 'client')).to.matchPattern(`[
    {
      id: ${memberships[0].id},
      client: ${testClientId},
      paid_until: '2020-05-31',
      ...
    },
    {
      id: ${memberships[1].id},
      client: ${fixtures.testClient2.id},
      paid_until: '2020-05-31',
      ...
    }]`);

    const updatedMembershipPauses = await MembershipPause.find({id: _.map(membershipPauses, 'id')});
    expect(updatedMembershipPauses).to.matchPattern(`[
    {
      id: ${membershipPauses[0].id},
      is_applied_to_membership_at: 1234567890,
      ...
    },
    {
      id: ${membershipPauses[1].id},
      is_applied_to_membership_at: _.isBetween|${timestampBeforeCall - 1}|${timestampAfterCall +1},
      ...
    },
    {
      id: ${membershipPauses[2].id},
      is_applied_to_membership_at: 1234567890,
      ...
    },
    {
      id: ${membershipPauses[3].id},
      is_applied_to_membership_at: _.isBetween|${timestampBeforeCall - 1}|${timestampAfterCall +1},
      ...
    }
    ]`);

    const membershipLogEntries = await MembershipLog.find();
    expect(membershipLogEntries).to.matchPattern(`[
      {
        client: ${testClientId},
        membership: ${memberships[0].id},
        entry: 'Membership pause ended. Payment date changed from Friday, May 1, 2020 to Monday, June 1, 2020.',
        ... 
      },
      {
        client: ${fixtures.testClient2.id},
        membership: ${memberships[1].id},
        entry: 'Bero afsluttet. Betalingsdato ændret fra fredag d. 1. maj 2020 til mandag d. 1. juni 2020.',
        ... 
      }
    ]`);

    MockDate.reset();

    await Membership.destroy({id: _.map(memberships, 'id')});
    await MembershipPause.destroy({id: _.map(membershipPauses, 'id')});
    await ClientSettings.destroy({id: clientSettingsRow.id});

  });

});
