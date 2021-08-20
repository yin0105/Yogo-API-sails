const testClientId = require('../../../../global-test-variables').TEST_CLIENT_ID;

const moment = require('moment-timezone');
const assert = require('assert');

const MockDate = require('mockdate');


describe('helpers.populate.memberships.cancelled-from-date-including-membership-pause', async () => {

  afterEach(async () => {
    MockDate.reset();
  });

  it('should return an empty array if input array is empty', async () => {

    const result = await sails.helpers.populate.memberships.cancelledFromDateIncludingMembershipPause([]);

    assert.deepStrictEqual(
      result,
      [],
    );

  });

  it('should return input unchanged if already populated', async () => {

    const memberships = [
      {
        cancelled_from_date_including_membership_pause: '2020-05-01',
      },
      {
        cancelled_from_date_including_membership_pause: null,
      },
    ];

    await sails.helpers.populate.memberships.cancelledFromDateIncludingMembershipPause(memberships);

    assert.deepStrictEqual(
      memberships,
      [
        {
          cancelled_from_date_including_membership_pause: '2020-05-01',
        },
        {
          cancelled_from_date_including_membership_pause: null,
        },
      ],
    );

  });

  it('should return input unchanged if already populated with null values', async () => {

    const memberships = [
      {
        cancelled_from_date_including_membership_pause: null,
      },
    ];

    await sails.helpers.populate.memberships.cancelledFromDateIncludingMembershipPause(memberships);

    assert.deepStrictEqual(
      memberships,
      [
        {
          cancelled_from_date_including_membership_pause: null,
        },
      ],
    );

  });

  it('should return null if membership is active', async () => {

    MockDate.set(moment.tz('2020-05-01 00:00:00', 'Europe/Copenhagen'));

    const membership = await Membership.create({
      client: testClientId,
      status: 'active'
    }).fetch();

    const membershipPause = await MembershipPause.create(
      {
        client_id: testClientId,
        membership_id: membership.id,
        start_date: '2020-05-01',
        end_date: '2020-06-01',
      },
    ).fetch();

    await sails.helpers.populate.memberships.cancelledFromDateIncludingMembershipPause([membership]);

    expect(membership).to.matchPattern(`{    
      id: ${membership.id},  
      cancelled_from_date_including_membership_pause: null,        
      ...
    }`,
    );

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: membershipPause.id});

  });

  it('should return null if membership is ended', async () => {

    MockDate.set(moment.tz('2020-05-01 00:00:00', 'Europe/Copenhagen'));

    const membership = await Membership.create({
      client: testClientId,
      status: 'ended'
    }).fetch();

    const membershipPause = await MembershipPause.create(
      {
        client_id: testClientId,
        membership_id: membership.id,
        start_date: '2020-05-01',
        end_date: '2020-06-01',
      },
    ).fetch();

    await sails.helpers.populate.memberships.cancelledFromDateIncludingMembershipPause([membership]);

    expect(membership).to.matchPattern(`{    
      id: ${membership.id},  
      cancelled_from_date_including_membership_pause: null,        
      ...
    }`,
    );

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: membershipPause.id});

  });

  it('should account for membership pause', async () => {

    MockDate.set(moment.tz('2020-05-01 00:00:00', 'Europe/Copenhagen'));

    const membership = (await Membership.create({
      client: testClientId,
      status: 'cancelled_running',
      cancelled_from_date: '2020-06-01',
    }).fetch()).toJSON();

    const membershipPause = await MembershipPause.create(
      {
        client_id: testClientId,
        membership_id: membership.id,
        start_date: '2020-05-01',
        end_date: '2020-06-01',
      },
    ).fetch();

    await sails.helpers.populate.memberships.cancelledFromDateIncludingMembershipPause([membership]);

    expect(membership).to.matchPattern(`{    
      id: ${membership.id},  
      cancelled_from_date: '2020-06-01',
      cancelled_from_date_including_membership_pause: '2020-07-02',        
      ...
    }`,
    );

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: membershipPause.id});

  });

  it('should use cancelled_from_date if no membership pause', async () => {

    MockDate.set(moment.tz('2020-05-01 00:00:00', 'Europe/Copenhagen'));

    const membership = (await Membership.create({
      client: testClientId,
      status: 'cancelled_running',
      cancelled_from_date: '2020-06-01',
    }).fetch()).toJSON();

    const membershipPause = await MembershipPause.create(
      {
        client_id: testClientId,
        membership_id: membership.id,
        start_date: '2020-04-01',
        end_date: '2020-05-01',
        is_applied_to_membership_at: 1234567890
      },
    ).fetch();

    await sails.helpers.populate.memberships.cancelledFromDateIncludingMembershipPause([membership]);

    expect(membership).to.matchPattern(`{    
      id: ${membership.id},  
      cancelled_from_date: '2020-06-01',
      cancelled_from_date_including_membership_pause: '2020-06-01',        
      ...
    }`,
    );

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: membershipPause.id});

  });


});
