const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID;
const fixtures = require('../../../fixtures/factory').fixtures;
const mockdate = require('mockdate');
const moment = require('moment-timezone');

describe('get-valid-memberships-for-class--max-simultaneous-bookings', async function () {

  let
    yogaClass1,
    yogaClass2,
    yogaClass3,
    yogaClass4,
    yogaClass5;

  before(async () => {

    await Class.destroy({});

    yogaClass1 = await Class.create({
      class_type: fixtures.classTypeYoga.id,
      date: '2018-05-14',
      start_time: '09:00:00',
      client: testClientId,
      seats: 15,
      archived: false,
      cancelled: false,
    }).fetch();

    yogaClass2 = await Class.create({
      class_type: fixtures.classTypeYoga.id,
      date: '2018-05-15',
      start_time: '10:00:00',
      client: testClientId,
      seats: 15,
      archived: false,
      cancelled: false,
    }).fetch();

    yogaClass3 = await Class.create({
      class_type: fixtures.classTypeYoga.id,
      date: '2018-05-15',
      start_time: '16:00:00',
      client: testClientId,
      seats: 15,
      archived: false,
      cancelled: false,
    }).fetch();

    yogaClass4 = await Class.create({
      class_type: fixtures.classTypeYoga.id,
      date: '2018-05-16',
      start_time: '16:00:00',
      client: testClientId,
      seats: 15,
      archived: false,
      cancelled: false,
    }).fetch();

    yogaClass5 = await Class.create({
      class_type: fixtures.classTypeYoga.id,
      date: '2018-05-20',
      start_time: '16:00:00',
      client: testClientId,
      seats: 15,
      archived: false,
      cancelled: false,
    }).fetch();

  });

  after(async () => {
    await Class.destroy({id: [yogaClass1.id, yogaClass2.id, yogaClass3.id, yogaClass4.id, yogaClass5.id]});
  });

  it('should return memberships with max number of simultaneous bookings if customer has no bookings', async () => {

    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'active',
      paid_until: '2018-01-01',
    }).fetch();

    await MembershipType.update({id: fixtures.membershipTypeYogaUnlimited.id}, {
      has_max_number_of_simultaneous_bookings: true,
      max_number_of_simultaneous_bookings: 2,
    });

    mockdate.set(moment.tz('2018-05-15 10:00:00', 'Europe/Copenhagen'));

    const validMemberships = await sails.helpers.classes.getValidMembershipsForClass.with({
      user: fixtures.userAlice,
      classItem: yogaClass3,
    });

    expect(validMemberships).to.matchPattern(
      `[
        {
          id: ${membership.id},
          ...
        }
      ]`,
    );

    await Membership.destroy({id: membership.id});

    await MembershipType.update({id: fixtures.membershipTypeYogaUnlimited.id}, {
      has_max_number_of_simultaneous_bookings: false,
    });

    mockdate.reset();

  });

  it('should return memberships that have not reached their limit of future signups', async () => {

    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'active',
      paid_until: '2018-01-01',
    }).fetch();

    await MembershipType.update({id: fixtures.membershipTypeYogaUnlimited.id}, {
      has_max_number_of_simultaneous_bookings: true,
      max_number_of_simultaneous_bookings: 2,
    });

    const signups = await ClassSignup.createEach([
      {
        'class': yogaClass1.id,
        user: fixtures.userAlice.id,
        used_membership: membership.id,
        archived: false,
      },
      {
        'class': yogaClass2.id,
        user: fixtures.userAlice.id,
        used_membership: membership.id,
        archived: false,
      },
      {
        'class': yogaClass4.id,
        user: fixtures.userAlice.id,
        used_membership: membership.id,
        archived: false,
      },
      {
        'class': yogaClass5.id,
        user: fixtures.userAlice.id,
        archived: false,
      },
    ]).fetch();

    mockdate.set(moment.tz('2018-05-15 10:00:00', 'Europe/Copenhagen'));

    const validMemberships = await sails.helpers.classes.getValidMembershipsForClass.with({
      user: fixtures.userAlice,
      classItem: yogaClass3,
    });

    expect(validMemberships).to.matchPattern(
      `[
        {
          id: ${membership.id},
          ...
        }
      ]`,
    );

    await Membership.destroy({id: membership.id});
    await ClassSignup.destroy({id: _.map(signups, 'id')});

    await MembershipType.update({id: fixtures.membershipTypeYogaUnlimited.id}, {
      has_max_number_of_simultaneous_bookings: false,
    });

    mockdate.reset();

  });

  it('should not return memberships that have reached their limit of future signups', async () => {

    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'active',
      paid_until: '2018-01-01',
    }).fetch();

    await MembershipType.update({id: fixtures.membershipTypeYogaUnlimited.id}, {
      has_max_number_of_simultaneous_bookings: true,
      max_number_of_simultaneous_bookings: 2,
    });

    const signups = await ClassSignup.createEach([
      {
        'class': yogaClass4.id,
        user: fixtures.userAlice.id,
        used_membership: membership.id,
        archived: false,
      },
      {
        'class': yogaClass5.id,
        user: fixtures.userAlice.id,
        used_membership: membership.id,
        archived: false,
      },
    ]).fetch();

    mockdate.set(moment.tz('2018-05-15 10:00:00', 'Europe/Copenhagen'));

    const validMemberships = await sails.helpers.classes.getValidMembershipsForClass.with({
      user: fixtures.userAlice,
      classItem: yogaClass3,
    });

    expect(validMemberships).to.matchPattern([]);

    await Membership.destroy({id: membership.id});
    await ClassSignup.destroy({id: _.map(signups, 'id')});

    await MembershipType.update({id: fixtures.membershipTypeYogaUnlimited.id}, {
      has_max_number_of_simultaneous_bookings: false,
    });

    mockdate.reset();

  });

  it('should not return memberships that have reached their limit of future signups, but still return other memberships', async () => {

    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'active',
      paid_until: '2018-01-01',
    }).fetch();

    await MembershipType.update({id: fixtures.membershipTypeYogaUnlimited.id}, {
      has_max_number_of_simultaneous_bookings: true,
      max_number_of_simultaneous_bookings: 2,
    });

    const membership2 = await Membership.create({
      user: fixtures.userAlice.id,
      membership_type: fixtures.membershipTypeYogaTwoClassesPerWeek.id,
      status: 'active',
      paid_until: '2018-01-01',
    }).fetch();

    const signups = await ClassSignup.createEach([
      {
        'class': yogaClass4.id,
        user: fixtures.userAlice.id,
        used_membership: membership.id,
        archived: false,
      },
      {
        'class': yogaClass5.id,
        user: fixtures.userAlice.id,
        used_membership: membership.id,
        archived: false,
      },
    ]).fetch();

    mockdate.set(moment.tz('2018-05-15 10:00:00', 'Europe/Copenhagen'));

    const validMemberships = await sails.helpers.classes.getValidMembershipsForClass.with({
      user: fixtures.userAlice,
      classItem: yogaClass3,
    });

    expect(validMemberships).to.matchPattern(`[
      {
        id: ${membership2.id},
        ... 
      }
    ]`);

    await Membership.destroy({id: [membership.id, membership2.id]});
    await ClassSignup.destroy({id: _.map(signups, 'id')});

    await MembershipType.update({id: fixtures.membershipTypeYogaUnlimited.id}, {
      has_max_number_of_simultaneous_bookings: false,
    });

    mockdate.reset();

  });

});
