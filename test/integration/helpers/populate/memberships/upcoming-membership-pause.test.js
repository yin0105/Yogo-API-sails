const testClientId = require('../../../../global-test-variables').TEST_CLIENT_ID;

const moment = require('moment-timezone');
const assert = require('assert');

const MockDate = require('mockdate');


describe('helpers.populate.memberships.upcoming-membership-pause', async () => {

  afterEach(async () => {
    MockDate.reset();
  });

  it('should return an empty array if input array is empty', async () => {

    const result = await sails.helpers.populate.memberships.upcomingMembershipPause([]);

    assert.deepStrictEqual(
      result,
      [],
    );

  });

  it('should return input unchanged if already populated', async () => {

    const memberships = [
      {
        upcoming_membership_pause: {
          id: 1,
        },
      },
      {
        upcoming_membership_pause: null,
      },
    ];

    await sails.helpers.populate.memberships.upcomingMembershipPause(memberships);

    assert.deepStrictEqual(
      memberships,
      [
        {
          upcoming_membership_pause: {
            id: 1,
          },
        },
        {
          upcoming_membership_pause: null,
        },
      ],
    );

  });

  it('should return input unchanged if already populated with null values', async () => {

    const memberships = [
      {
        upcoming_membership_pause: null,
      },
    ];

    await sails.helpers.populate.memberships.upcomingMembershipPause(memberships);

    assert.deepStrictEqual(
      memberships,
      [
        {
          upcoming_membership_pause: null,
        },
      ],
    );

  });

  it('should populate an upcoming membership pause', async () => {

    MockDate.set(moment.tz('2020-05-01 00:00:00', 'Europe/Copenhagen'));

    const membership = await Membership.create({
      client: testClientId,
    }).fetch();

    const membershipPause = await MembershipPause.create(
      {
        client_id: testClientId,
        membership_id: membership.id,
        start_date: '2020-05-02',
        end_date: '2020-05-03',
      },
    ).fetch();

    await sails.helpers.populate.memberships.upcomingMembershipPause([membership]);

    expect(membership).to.matchPattern(`{    
      id: ${membership.id},  
      upcoming_membership_pause: {
        id: ${membershipPause.id},
        ...
      },
      ...
    }`,
    );

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: membershipPause.id})

  });

  it('should populate an upcoming membership pause without end date', async () => {

    MockDate.set(moment.tz('2020-05-01 00:00:00', 'Europe/Copenhagen'));

    const membership = await Membership.create({
      client: testClientId,
    }).fetch();

    const membershipPause = await MembershipPause.create(
      {
        client_id: testClientId,
        membership_id: membership.id,
        start_date: '2020-05-02',
      },
    ).fetch();

    await sails.helpers.populate.memberships.upcomingMembershipPause([membership]);

    expect(membership).to.matchPattern(`{    
      id: ${membership.id},  
      upcoming_membership_pause: {
        id: ${membershipPause.id},
        ...
      },
      ...
    }`,
    );

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: membershipPause.id})

  });

  it('should disregard a current membership pause', async () => {

    MockDate.set(moment.tz('2020-05-01 00:00:00', 'Europe/Copenhagen'));

    const membership = await Membership.create({
      client: testClientId,
    }).fetch();

    const membershipPause = await MembershipPause.create(
      {
        client_id: testClientId,
        membership_id: membership.id,
        start_date: '2020-05-01',
        end_date: '2020-05-02'
      },
    ).fetch();

    await sails.helpers.populate.memberships.upcomingMembershipPause([membership]);

    expect(membership).to.matchPattern(`{    
      id: ${membership.id},  
      upcoming_membership_pause: null,
      ...
    }`,
    );

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: membershipPause.id})

  });

  it('should disregard a current membership pause without end date', async () => {

    MockDate.set(moment.tz('2020-05-01 00:00:00', 'Europe/Copenhagen'));

    const membership = await Membership.create({
      client: testClientId,
    }).fetch();

    const membershipPause = await MembershipPause.create(
      {
        client_id: testClientId,
        membership_id: membership.id,
        start_date: '2020-05-01',
      },
    ).fetch();

    await sails.helpers.populate.memberships.upcomingMembershipPause([membership]);

    expect(membership).to.matchPattern(`{    
      id: ${membership.id},  
      upcoming_membership_pause: null,
      ...
    }`,
    );

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: membershipPause.id})

  });

  it('should disregard a past membership pause', async () => {

    MockDate.set(moment.tz('2020-05-01 00:00:00', 'Europe/Copenhagen'));

    const membership = await Membership.create({
      client: testClientId,
    }).fetch();

    const membershipPause = await MembershipPause.create(
      {
        client_id: testClientId,
        membership_id: membership.id,
        start_date: '2020-04-30',
        end_date: '2020-05-01'
      },
    ).fetch();

    await sails.helpers.populate.memberships.upcomingMembershipPause([membership]);

    expect(membership).to.matchPattern(`{    
      id: ${membership.id},  
      upcoming_membership_pause: null,
      ...
    }`,
    );

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: membershipPause.id})

  });

  it('should work with multiple memberships', async () => {

    MockDate.set(moment.tz('2020-05-01 00:00:00', 'Europe/Copenhagen'));

    const memberships = await Membership.createEach([
        {
          client: testClientId,
        },
        {
          client: testClientId,
        },
        {
          client: testClientId,
        },
      ],
    ).fetch();

    const membershipPauses = await MembershipPause.createEach([
        {
          client_id: testClientId,
          membership_id: memberships[0].id,
          start_date: '2020-05-02',
          end_date: '2020-05-03',
        },
        {
          client_id: testClientId,
          membership_id: memberships[1].id,
          start_date: '2020-05-02',
        },
        {
          client_id: testClientId,
          membership_id: memberships[2].id,
          start_date: '2020-05-01',
        },
      ],
    ).fetch();

    await sails.helpers.populate.memberships.upcomingMembershipPause(memberships);

    expect(memberships).to.matchPattern(`[
    {    
      id: ${memberships[0].id},  
      upcoming_membership_pause: {
        id: ${membershipPauses[0].id},
        ...
      },
      ...
    },
    {    
      id: ${memberships[1].id},  
      upcoming_membership_pause: {
        id: ${membershipPauses[1].id},
        ...
      },
      ...
    },
    {    
      id: ${memberships[2].id},  
      upcoming_membership_pause: null,
      ...
    }]`,
    );

    await Membership.destroy({id: _.map(memberships, 'id')});
    await MembershipPause.destroy({id: _.map(membershipPauses, 'id')});

  });

});
