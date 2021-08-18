const assert = require('assert');
const assertAsyncThrows = require('../../../utils/assert-async-throws');

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID;
const fixtures = require('../../../fixtures/factory').fixtures;

const mockdate = require('mockdate');
const moment = require('moment-timezone');

const compareNumbers = function (a, b) {
  return a - b;
};

describe('get-valid-memberships-for-class', async function () {

  let membershipYogaActive,
    membershipYogaActiveOtherRealUser,
    membershipYogaArchived,
    membershipCancelledRunningValid,
    membershipCancelledRunningInvalid,
    membershipEnded,
    membershipDance,
    membershipYogaUserBill,
    membershipYogaBillTwoClassesPerWeek,
    yogaClass1,
    yogaClass2,
    yogaClass3,
    cancelledClass,
    signupWithMembership,
    signup2,
    signup3,
    signupForCancelledClass;

  before(async () => {

    // SET UP MEMBERSHIPS
    membershipYogaActive = await Membership.create({
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      paid_until: '2018-05-20',
      client: testClientId,
      status: 'active',
      user: fixtures.userAlice.id,
    }).fetch();

    membershipYogaActiveOtherRealUser = await Membership.create({
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      paid_until: '2018-05-20',
      client: testClientId,
      status: 'active',
      user: fixtures.userAlice.id,
      real_user_is_someone_else: true,
      real_user_name: 'Dave',
    }).fetch();

    membershipYogaArchived = await Membership.create({
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      paid_until: '2018-05-20',
      client: testClientId,
      status: 'active',
      user: fixtures.userAlice.id,
      archived: true,
    }).fetch();

    membershipCancelledRunningValid = await Membership.create({
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      paid_until: '2018-04-20',
      client: testClientId,
      status: 'cancelled_running',
      cancelled_from_date: '2018-05-16',
      user: fixtures.userAlice.id,
    }).fetch();

    membershipCancelledRunningInvalid = await Membership.create({
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      paid_until: '2018-04-20',
      client: testClientId,
      status: 'cancelled_running',
      cancelled_from_date: '2018-05-15',
      user: fixtures.userAlice.id,
    }).fetch();

    membershipEnded = await Membership.create({
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      paid_until: '2018-05-20',
      client: testClientId,
      status: 'ended',
      user: fixtures.userAlice.id,
    }).fetch();

    membershipDance = await Membership.create({
      membership_type: fixtures.membershipTypeDance.id,
      paid_until: '2018-05-20',
      client: testClientId,
      status: 'active',
      user: fixtures.userAlice.id,
    }).fetch();

    membershipYogaUserBill = await Membership.create({
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      paid_until: '2018-05-30',
      client: testClientId,
      status: 'active',
      user: fixtures.userBill.id,
    }).fetch();

    membershipYogaBillTwoClassesPerWeek = await Membership.create({
      membership_type: fixtures.membershipTypeYogaTwoClassesPerWeek.id,
      paid_until: '2018-05-30',
      client: testClientId,
      status: 'active',
      user: fixtures.userBill.id,
    }).fetch();

    // SET UP CLASSES
    yogaClass1 = await Class.create({
      class_type: fixtures.classTypeYoga.id,
      date: '2018-05-15',
      client: testClientId,
      seats: 15,
    }).fetch();

    yogaClass2 = await Class.create({
      class_type: fixtures.classTypeYoga.id,
      date: '2018-05-14',
      client: testClientId,
      seats: 15,
    }).fetch();

    yogaClass3 = await Class.create({
      class_type: fixtures.classTypeYoga.id,
      date: '2018-05-20',
      client: testClientId,
      seats: 15,
    }).fetch();

    cancelledClass = await Class.create({
      class_type: fixtures.classTypeYoga.id,
      date: '2018-05-16',
      client: testClientId,
      seats: 15,
      cancelled: true,
    }).fetch();

    // SET UP SIGNUPS
    signupWithMembership = await ClassSignup.create({
      'class': yogaClass1.id,
      user: fixtures.userAlice.id,
      used_membership: membershipYogaActive.id,
    }).fetch();

    signup2 = await ClassSignup.create({
      'class': yogaClass2.id,
      user: fixtures.userBill.id,
      used_membership: membershipYogaBillTwoClassesPerWeek.id,
    }).fetch();

    signup3 = await ClassSignup.create({
      'class': yogaClass3.id,
      user: fixtures.userBill.id,
      used_membership: membershipYogaBillTwoClassesPerWeek.id,
    }).fetch();

    signupForCancelledClass = await ClassSignup.create({
      'class': cancelledClass.id,
      user: fixtures.userBill.id,
      used_membership: membershipYogaBillTwoClassesPerWeek.id,
    }).fetch();

  });

  after(async () => {
    await Membership.destroy({
      id:
        _.map([
            membershipYogaActive,
            membershipYogaActiveOtherRealUser,
            membershipYogaArchived,
            membershipCancelledRunningValid,
            membershipCancelledRunningInvalid,
            membershipEnded,
            membershipDance,
            membershipYogaUserBill,
            membershipYogaBillTwoClassesPerWeek,
          ],
          'id',
        ),
    });
    await Class.destroy({id: [yogaClass1.id, yogaClass2.id, yogaClass3.id]});
    await ClassSignup.destroy({id: [signupWithMembership.id, signup2.id, signup3.id, signupForCancelledClass.id]});
  });


  it('should throw "classNotFound" if class is not in the database. Test with ID input.', async () => {

    await assertAsyncThrows(
      async () => {
        await sails.helpers.classes.getValidMembershipsForClass.with({
          user: fixtures.userAlice,
          classItem: 9999999,
        });
      },
      'classNotFound',
    );

  });


  it('should throw "classNotFound" if class is not in the database. Test with object input.', async () => {

    await assertAsyncThrows(
      async () => {
        await sails.helpers.classes.getValidMembershipsForClass.with({
          user: fixtures.userAlice,
          classItem: {
            id: 9999999,
          },
        });
      },
      'classNotFound',
    );

  });

  it('should throw "classNotFound" if class is not in the database. Test with archived class.', async () => {

    const archivedClass = await Class.create({
      archived: true,
    }).fetch();

    await assertAsyncThrows(
      async () => {
        await sails.helpers.classes.getValidMembershipsForClass.with({
          user: fixtures.userAlice,
          classItem: archivedClass,
        });
      },
      'classNotFound',
    );

    await Class.destroy({
      id: archivedClass.id,
    });

  });

  it('should return an array of memberships valid for the specified class, not including already used memberships.', async () => {

    let validMemberships = await sails.helpers.classes.getValidMembershipsForClass.with({
      user: fixtures.userAlice,
      classItem: yogaClass1,
    });

    const validMembershipIds = _.map(validMemberships, 'id');

    validMembershipIds.sort(compareNumbers);

    assert.deepEqual(
      validMembershipIds,
      [membershipYogaActiveOtherRealUser.id, membershipCancelledRunningValid.id],
    );

  });

  it('should exclude memberships that have reached their limit of classes per week', async () => {

    const classInQuestion = await Class.create({
      client: testClientId,
      date: '2020-12-08',
      start_time: '12:00:00',
      class_type: fixtures.classTypeYoga.id,
    }).fetch();

    const classesToCountTowardsLimit = await Class.createEach([
      {
        client: testClientId,
        date: '2020-12-07',
        start_time: '00:00:00',
        class_type: fixtures.classTypeYoga.id,
      },
      {
        client: testClientId,
        date: '2020-12-13',
        start_time: '23:59:59',
        class_type: fixtures.classTypeYoga.id,
      },
    ]).fetch();

    const membership = await Membership.create({
      client: testClientId,
      user: fixtures.userDennis.id,
      membership_type: fixtures.membershipTypeYogaTwoClassesPerWeek.id,
      status: 'active',
      paid_until: '2020-12-31',
    }).fetch();

    const signupsToCountTowardsLimit = await ClassSignup.createEach([
      {
        class: classesToCountTowardsLimit[0].id,
        user: fixtures.userDennis.id,
        used_membership: membership.id,
      },
      {
        class: classesToCountTowardsLimit[1].id,
        user: fixtures.userDennis.id,
        used_membership: membership.id,
      },
    ]).fetch();

    let validMemberships = await sails.helpers.classes.getValidMembershipsForClass.with({
      user: fixtures.userDennis,
      classItem: classInQuestion,
    });

    assert.deepStrictEqual(
      validMemberships,
      [],
    );

    await Class.destroy({id: _.map(_.concat([classInQuestion], classesToCountTowardsLimit), 'id')});
    await Membership.destroy({id: membership.id});
    await ClassSignup.destroy({id: _.map(signupsToCountTowardsLimit, 'id')});

  });

  it('should return memberships that have not reached their limit of classes per week', async () => {

    const classInQuestion = await Class.create({
      client: testClientId,
      date: '2020-12-08',
      start_time: '12:00:00',
      class_type: fixtures.classTypeYoga.id,
    }).fetch();

    const classesToCountTowardsLimit = await Class.createEach([
      {
        client: testClientId,
        date: '2020-12-07',
        start_time: '00:00:00',
        class_type: fixtures.classTypeYoga.id,
      },
    ]).fetch();

    const classesToNotCountTowardsLimit = await Class.createEach([
      {
        client: testClientId,
        date: '2020-12-14',
        start_time: '00:00:00',
        class_type: fixtures.classTypeYoga.id,
      },
      {
        client: testClientId,
        date: '2020-12-06',
        start_time: '23:59:59',
        class_type: fixtures.classTypeYoga.id,
      },
      {
        client: testClientId,
        date: '2020-12-08',
        start_time: '12:00:00',
        class_type: fixtures.classTypeYoga.id,
        archived: true,
      },
      {
        client: testClientId,
        date: '2020-12-08',
        start_time: '12:00:00',
        class_type: fixtures.classTypeYoga.id,
        cancelled: true,
      },
    ]).fetch();

    const membership = await Membership.create({
      client: testClientId,
      user: fixtures.userDennis.id,
      membership_type: fixtures.membershipTypeYogaTwoClassesPerWeek.id,
      status: 'active',
      paid_until: '2020-12-31',
    }).fetch();

    const signupsToCountTowardsLimit = await ClassSignup.createEach([
      {
        class: classesToCountTowardsLimit[0].id,
        user: fixtures.userDennis.id,
        used_membership: membership.id,
      },
    ]).fetch();

    const signupsToNotCountTowardsLimit = await ClassSignup.createEach(_.map(classesToNotCountTowardsLimit, cl => ({
      class: cl.id,
      user: fixtures.userDennis.id,
      used_membership: membership.id,
    }))).fetch();

    let validMemberships = await sails.helpers.classes.getValidMembershipsForClass.with({
      user: fixtures.userDennis,
      classItem: classInQuestion,
    });

    assert.deepStrictEqual(
      _.map(validMemberships, 'id'),
      [membership.id],
    );

    await Class.destroy({id: _.map(_.concat([classInQuestion], classesToCountTowardsLimit, classesToNotCountTowardsLimit), 'id')});
    await Membership.destroy({id: membership.id});
    await ClassSignup.destroy({id: _.map(_.concat(signupsToCountTowardsLimit, signupsToNotCountTowardsLimit), 'id')});

  });



  it('should exclude memberships that have reached their limit of future signups', async () => {

    mockdate.set(moment.tz('2020-12-06', 'Europe/Copenhagen'));

    const classInQuestion = await Class.create({
      client: testClientId,
      date: '2020-12-08',
      start_time: '12:00:00',
      class_type: fixtures.classTypeYoga.id,
    }).fetch();

    const classesToCountTowardsLimit = await Class.createEach([
      {
        client: testClientId,
        date: '2020-12-07',
        start_time: '00:00:00',
        class_type: fixtures.classTypeYoga.id,
      },
      {
        client: testClientId,
        date: '2020-12-14',
        start_time: '00:00:00',
        class_type: fixtures.classTypeYoga.id,
      },
    ]).fetch();

    const membership = await Membership.create({
      client: testClientId,
      user: fixtures.userDennis.id,
      membership_type: fixtures.membershipTypeYogaTwoClassesPerWeek.id,
      status: 'active',
      paid_until: '2020-12-31',
    }).fetch();

    await MembershipType.update({id: fixtures.membershipTypeYogaTwoClassesPerWeek.id}, {
      has_max_number_of_simultaneous_bookings: true,
      max_number_of_simultaneous_bookings: 2
    });

    const signupsToCountTowardsLimit = await ClassSignup.createEach([
      {
        class: classesToCountTowardsLimit[0].id,
        user: fixtures.userDennis.id,
        used_membership: membership.id,
      },
      {
        class: classesToCountTowardsLimit[1].id,
        user: fixtures.userDennis.id,
        used_membership: membership.id,
      },
    ]).fetch();

    let validMemberships = await sails.helpers.classes.getValidMembershipsForClass.with({
      user: fixtures.userDennis,
      classItem: classInQuestion,
    });

    assert.deepStrictEqual(
      validMemberships,
      [],
    );

    await Class.destroy({id: _.map(_.concat([classInQuestion], classesToCountTowardsLimit), 'id')});
    await Membership.destroy({id: membership.id});
    await MembershipType.update({id: fixtures.membershipTypeYogaTwoClassesPerWeek.id}, {has_max_number_of_simultaneous_bookings: false});
    await ClassSignup.destroy({id: _.map(signupsToCountTowardsLimit, 'id')});
    mockdate.reset();

  });

  it('should return memberships that have not reached their limit of future signups', async () => {

    mockdate.set(moment.tz('2020-12-06 12:00:00', 'Europe/Copenhagen'));

    const classInQuestion = await Class.create({
      client: testClientId,
      date: '2020-12-08',
      start_time: '12:00:00',
      class_type: fixtures.classTypeYoga.id,
    }).fetch();

    const classesToCountTowardsLimit = await Class.createEach([
      {
        client: testClientId,
        date: '2020-12-07',
        start_time: '00:00:00',
        class_type: fixtures.classTypeYoga.id,
      },
    ]).fetch();

    const classesToNotCountTowardsLimit = await Class.createEach([
      {
        client: testClientId,
        date: '2020-12-06',
        start_time: '12:00:00', // Classes are not counted as soon as they have started
        class_type: fixtures.classTypeYoga.id,
      },
      {
        client: testClientId,
        date: '2020-12-08',
        start_time: '12:00:00',
        class_type: fixtures.classTypeYoga.id,
        archived: true,
      },
      {
        client: testClientId,
        date: '2020-12-08',
        start_time: '12:00:00',
        class_type: fixtures.classTypeYoga.id,
        cancelled: true,
      },
    ]).fetch();

    const membership = await Membership.create({
      client: testClientId,
      user: fixtures.userDennis.id,
      membership_type: fixtures.membershipTypeYogaTwoClassesPerWeek.id,
      status: 'active',
      paid_until: '2020-12-31',
    }).fetch();

    await MembershipType.update({id: fixtures.membershipTypeYogaTwoClassesPerWeek.id}, {
      has_max_number_of_simultaneous_bookings: true,
      max_number_of_simultaneous_bookings: 2
    });

    const signupsToCountTowardsLimit = await ClassSignup.createEach([
      {
        class: classesToCountTowardsLimit[0].id,
        user: fixtures.userDennis.id,
        used_membership: membership.id,
      },
    ]).fetch();

    const signupsToNotCountTowardsLimit = await ClassSignup.createEach(_.map(classesToNotCountTowardsLimit, cl => ({
      class: cl.id,
      user: fixtures.userDennis.id,
      used_membership: membership.id,
    }))).fetch();

    let validMemberships = await sails.helpers.classes.getValidMembershipsForClass.with({
      user: fixtures.userDennis,
      classItem: classInQuestion,
    });

    assert.deepStrictEqual(
      _.map(validMemberships, 'id'),
      [membership.id],
    );

    await Class.destroy({id: _.map(_.concat([classInQuestion], classesToCountTowardsLimit, classesToNotCountTowardsLimit), 'id')});
    await Membership.destroy({id: membership.id});
    await MembershipType.update({id: fixtures.membershipTypeYogaTwoClassesPerWeek.id}, {has_max_number_of_simultaneous_bookings: false});
    await ClassSignup.destroy({id: _.map(_.concat(signupsToCountTowardsLimit, signupsToNotCountTowardsLimit), 'id')});
    mockdate.reset();

  });


});
