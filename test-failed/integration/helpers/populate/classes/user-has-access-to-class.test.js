const fixtures = require('../../../../fixtures/factory').fixtures;
const testClientId = require('../../../../global-test-variables').TEST_CLIENT_ID;
const assert = require('assert');
const comparePartialObject = require('../../../../utils/compare-partial-object');
const mockdate = require('mockdate');
const moment = require('moment-timezone');

describe('helpers.populate.classes.user-has-access-to-class', async function () {

  let
    yogaClass1,
    yogaClass2,
    yogaClass3,
    yogaClassWeekBefore,
    yogaClassWeekAfter,
    yogaClassCancelled,
    privateYogaClass,
    danceClass1,
    allClasses;

  before(async () => {
    yogaClass1 = await Class.create({
      client: testClientId,
      seats: 20,
      class_type: fixtures.classTypeYoga.id,
      date: '2019-05-15',
      start_time: '10:00:00',
    }).fetch();
    yogaClass2 = await Class.create({
      client: testClientId,
      seats: 20,
      class_type: fixtures.classTypeYoga.id,
      date: '2019-05-16',
      start_time: '10:00:00',
    }).fetch();
    yogaClass3 = await Class.create({
      client: testClientId,
      seats: 20,
      class_type: fixtures.classTypeYoga.id,
      date: '2019-05-16',
      start_time: '16:00:00',
    }).fetch();
    yogaClassWeekBefore = await Class.create({
      client: testClientId,
      seats: 20,
      class_type: fixtures.classTypeYoga.id,
      date: '2019-05-12',
      start_time: '23:59:59',
    }).fetch();
    yogaClassWeekAfter = await Class.create({
      client: testClientId,
      seats: 20,
      class_type: fixtures.classTypeYoga.id,
      date: '2019-05-20',
      start_time: '00:00:00',
    }).fetch();
    yogaClassCancelled = await Class.create({
      client: testClientId,
      seats: 20,
      class_type: fixtures.classTypeYoga.id,
      date: '2019-05-15',
      start_time: '16:00:00',
      cancelled: true,
    }).fetch();
    privateYogaClass = await Class.create({
      client: testClientId,
      seats: 1,
      class_type: fixtures.classTypeYoga.id,
      date: '2019-05-15',
      start_time: '10:00:00',
    }).fetch();
    danceClass1 = await Class.create({
      client: testClientId,
      seats: 1,
      class_type: fixtures.classTypeDance.id,
      date: '2019-05-15',
      start_time: '10:00:00',
    }).fetch();

    allClasses = [
      yogaClass1,
      yogaClass2,
      yogaClass3,
      yogaClassWeekBefore,
      yogaClassWeekAfter,
      yogaClassCancelled,
      privateYogaClass,
      danceClass1,
    ];

    _.each(allClasses, item => {
        item.class_type_id = item.class_type;
      },
    );


  });

  after(async () => {
    await Class.destroy({
      id: [
        yogaClass1.id,
        yogaClass2.id,
        yogaClass3.id,
        yogaClassWeekBefore.id,
        yogaClassWeekAfter.id,
        yogaClassCancelled.id,
        privateYogaClass.id,
        danceClass1.id,
      ],
    });

  });


  it('should return an empty array if input is empty', async () => {

    const result = await sails.helpers.populate.classes.userHasAccessToClass([], fixtures.userAlice);

    assert(_.isArray(result) && result.length === 0);

  });


  it('should return input array unchanged if input is already populated', async () => {

    const workingCopy = _.map(_.cloneDeep(allClasses), cls => {
      cls.user_has_access_to_class = true;
      return cls;
    });

    await sails.helpers.populate.classes.userHasAccessToClass(workingCopy, fixtures.userAlice);

    assert.deepStrictEqual(
      _.map(workingCopy, 'user_has_access_to_class'),
      [true, true, true, true, true, true, true, true],
    );

  });

  it('should return false on all classes if a user is not provided', async () => {
    const classes = _.cloneDeep(allClasses);

    await sails.helpers.populate.classes.userHasAccessToClass(classes);

    comparePartialObject(
      classes,
      [
        {user_has_access_to_class: false},
        {user_has_access_to_class: false},
        {user_has_access_to_class: false},
        {user_has_access_to_class: false},
        {user_has_access_to_class: false},
        {user_has_access_to_class: false},
        {user_has_access_to_class: false},
        {user_has_access_to_class: false},
      ],
    );
  });


  it('should return false for all classes, if user has no valid class passes or membership, only expired or ended', async () => {

    await Membership.destroy({});
    await ClassPass.destroy({});

    const endedMembership = await Membership.create({
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'ended',
      user: fixtures.userAlice.id,
      paid_until: '2019-05-15',
      archived: false,
    }).fetch();

    const cancelledMembershipExpiringBeforeClasses = await Membership.create({
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'cancelled_running',
      user: fixtures.userAlice.id,
      paid_until: '2019-04-10',
      cancelled_from_date: '2019-05-10',
      archived: false,
    }).fetch();

    const archivedMembership = await Membership.create({
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'active',
      user: fixtures.userAlice.id,
      paid_until: '2019-05-20',
      archived: true,
    }).fetch();

    const expiredClassPass = await ClassPass.create({
      class_pass_type: fixtures.classPassTypeYogaTenClasses.id,
      classes_left: 10,
      valid_until: '2019-05-01',
      archived: false,
      user: fixtures.userAlice.id,
    }).fetch();

    const classPassWithNoClassesLeft = await ClassPass.create({
      class_pass_type: fixtures.classPassTypeYogaTenClasses.id,
      classes_left: 0,
      valid_until: '2019-06-01',
      archived: false,
      user: fixtures.userAlice.id,
    }).fetch();

    const archivedPass = await ClassPass.create({
      class_pass_type: fixtures.classPassTypeYogaTenClasses.id,
      classes_left: 10,
      valid_until: '2019-06-01',
      archived: true,
      user: fixtures.userAlice.id,
    }).fetch();

    const workingCopy = _.cloneDeep(allClasses);

    const result = await sails.helpers.populate.classes.userHasAccessToClass(workingCopy, fixtures.userAlice);

    assert.deepStrictEqual(
      _.map(workingCopy, 'user_has_access_to_class'),
      [false, false, false, false, false, false, false, false],
    );

    assert.deepStrictEqual(
      _.map(workingCopy, 'user_has_access_to_class'),
      _.map(result, 'user_has_access_to_class'),
    );

    await Membership.destroy({id: [endedMembership.id, cancelledMembershipExpiringBeforeClasses.id, archivedMembership.id]});
    await ClassPass.destroy({id: [expiredClassPass.id, classPassWithNoClassesLeft.id, archivedPass.id]});

  });

  it('should return correct answer for each class, when user has a valid membership', async () => {
    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'active',
      paid_until: '2019-05-15',
      archived: false,
    }).fetch();

    const workingCopy = _.cloneDeep(allClasses);

    await sails.helpers.populate.classes.userHasAccessToClass(workingCopy, fixtures.userAlice);

    assert.deepStrictEqual(
      _.map(workingCopy, 'user_has_access_to_class'),
      [true, true, true, true, true, true, true, false],
    );

    await Membership.destroy({id: membership.id});

  });

  it('should return correct answer for each class, when user has a cancelled, but still valid membership', async () => {
    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'cancelled_running',
      paid_until: '2019-04-15',
      cancelled_from_date: '2019-05-16',
      archived: false,
    }).fetch();

    const workingCopy = _.cloneDeep(allClasses);

    await sails.helpers.populate.classes.userHasAccessToClass(workingCopy, fixtures.userAlice);

    assert.deepStrictEqual(
      _.map(workingCopy, 'user_has_access_to_class'),
      [true, false, false, true, false, true, true, false],
    );

    await Membership.destroy({id: membership.id});

  });

  it('should populate user_has_access_to_class when user has a valid membership with limited classes per week and still classes available', async () => {

    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      membership_type: fixtures.membershipTypeYogaTwoClassesPerWeek.id,
      status: 'active',
      paid_until: '2019-05-15',
      archived: false,
    }).fetch();

    const classesInQuestion = await Class.createEach([
      {
        client: testClientId,
        date: '2019-05-13',
        start_time: '00:00:00',
        end_time: '02:00:00',
        class_type: fixtures.classTypeYoga.id,
        seats: 20,
      },
      {
        client: testClientId,
        date: '2019-05-19',
        start_time: '23:59:59',
        end_time: '02:00:00',
        class_type: fixtures.classTypeYoga.id,
        seats: 20,
      },
    ]).fetch();

    const classAlreadyBooked = await Class.create(
      {
        client: testClientId,
        date: '2019-05-16',
        start_time: '12:00:00',
        end_time: '14:00:00',
        class_type: fixtures.classTypeYoga.id,
        seats: 20,
      }).fetch();

    const classesThatShouldNotCountTowardLimit = await Class.createEach([
      {
        client: testClientId,
        date: '2019-05-12',
        start_time: '23:59:59',
        end_time: '02:00:00',
        class_type_id: fixtures.classTypeYoga.id,
        seats: 20,

      },
      {
        client: testClientId,
        date: '2019-05-20',
        start_time: '00:00:00',
        end_time: '02:00:00',
        class_type_id: fixtures.classTypeYoga.id,
        seats: 20,
      },
    ]).fetch();

    const signup = await ClassSignup.create({
      class: classAlreadyBooked.id,
      user: fixtures.userAlice.id,
      used_membership: membership.id,
    }).fetch();

    const signupsThatShouldNotCountTowardsLimit = await ClassSignup.createEach([
      {
        class: classesThatShouldNotCountTowardLimit[0].id,
        user: fixtures.userAlice.id,
        used_membership: membership.id,
      },
      {
        class: classesThatShouldNotCountTowardLimit[1].id,
        user: fixtures.userAlice.id,
        used_membership: membership.id,
      },
    ]).fetch();

    await sails.helpers.populate.classes.userHasAccessToClass(classesInQuestion, fixtures.userAlice);

    assert.deepStrictEqual(
      _.map(classesInQuestion, 'user_has_access_to_class'),
      [true, true],
    );

    await Class.destroy({id: _.map(_.concat(classesInQuestion, classAlreadyBooked, classesThatShouldNotCountTowardLimit), 'id')});
    await Membership.destroy({id: membership.id});
    await ClassSignup.destroy({id: signup.id});
    await ClassSignup.destroy({id: _.map(signupsThatShouldNotCountTowardsLimit, 'id')});

  });

  it('should populate user_has_access_to_class when user has a valid membership with limited classes per week and no classes available', async () => {
    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      membership_type: fixtures.membershipTypeYogaTwoClassesPerWeek.id,
      status: 'active',
      paid_until: '2019-05-15',
      archived: false,
    }).fetch();

    const classInQuestion = await Class.create(
      {
        client: testClientId,
        date: '2019-05-13',
        start_time: '00:00:00',
        end_time: '02:00:00',
        class_type: fixtures.classTypeYoga.id,
        seats: 20,
      },
    ).fetch();

    const classesThatShouldCountTowardLimit = await Class.createEach([
      {
        client: testClientId,
        date: '2019-05-13',
        start_time: '00:00:00',
        end_time: '02:00:00',
        class_type_id: fixtures.classTypeYoga.id,
        seats: 20,

      },
      {
        client: testClientId,
        date: '2019-05-19',
        start_time: '23:59:59',
        end_time: '02:00:00',
        class_type_id: fixtures.classTypeYoga.id,
        seats: 20,
      },
    ]).fetch();

    const signupsThatShouldCountTowardsLimit = await ClassSignup.createEach([
      {
        class: classesThatShouldCountTowardLimit[0].id,
        user: fixtures.userAlice.id,
        used_membership: membership.id,
      },
      {
        class: classesThatShouldCountTowardLimit[1].id,
        user: fixtures.userAlice.id,
        used_membership: membership.id,
      },
    ]).fetch();

    await sails.helpers.populate.classes.userHasAccessToClass([classInQuestion], fixtures.userAlice);

    assert.strictEqual(
      classInQuestion.user_has_access_to_class,
      false,
    );

    await Class.destroy({id: _.map(_.concat(classesThatShouldCountTowardLimit, [classInQuestion]), 'id')});
    await Membership.destroy({id: membership.id});
    await ClassSignup.destroy({id: _.map(signupsThatShouldCountTowardsLimit, 'id')});

  });

  it('should return correct answer for each class, when user has a valid class pass fixed count, with classes left', async () => {
    const classPass = await ClassPass.create({
      user: fixtures.userAlice.id,
      class_pass_type: fixtures.classPassTypeYogaTenClasses.id,
      classes_left: 6,
      valid_until: '2019-05-19',
      archived: false,
    }).fetch();

    let workingCopy = _.cloneDeep(allClasses);

    await sails.helpers.populate.classes.userHasAccessToClass(workingCopy, fixtures.userAlice);

    assert.deepStrictEqual(
      _.map(workingCopy, 'user_has_access_to_class'),
      [true, true, true, true, false, true, true, false],
    );

    await ClassPass.destroy({id: classPass.id});

  });

  it('should return correct answer for each class, when user has a valid membership with limited simultaneous bookings and still classes available', async () => {

    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'active',
      paid_until: '2019-05-15',
      archived: false,
    }).fetch();

    await MembershipType.update({id: fixtures.membershipTypeYogaUnlimited.id}, {
      has_max_number_of_simultaneous_bookings: true,
      max_number_of_simultaneous_bookings: 2,
    });

    const signups = await ClassSignup.createEach([
      {
        'class': yogaClass1.id, // date: '2019-05-15', start_time: '10:00:00'
        user: fixtures.userAlice.id,
        used_membership: membership.id,
      },
      {
        'class': yogaClass2.id, // date: '2019-05-16', start_time: '10:00:00'
        user: fixtures.userAlice.id,
        used_membership: membership.id,
      },
      {
        'class': yogaClass3.id, // date: '2019-05-16', start_time: '16:00:00',
        user: fixtures.userAlice.id,
        used_membership: membership.id,
      },
      {
        'class': yogaClassWeekAfter.id, // date: '2019-05-20', start_time: '00:00:00',
        user: fixtures.userAlice.id,
      },
    ]);

    let workingCopy = _.cloneDeep(allClasses);

    mockdate.set(moment.tz('2019-05-16 10:00:00', 'Europe/Copenhagen')); // Class has just started, so next class is released

    await sails.helpers.populate.classes.userHasAccessToClass(workingCopy, fixtures.userAlice);

    assert.deepStrictEqual(
      _.map(workingCopy, 'user_has_access_to_class'),
      [true, true, true, true, true, true, true, false],
    );

    await Membership.destroy({id: membership.id});
    await ClassSignup.destroy({id: _.map(signups, 'id')});
    await MembershipType.update({id: fixtures.membershipTypeYogaUnlimited.id}, {
      has_max_number_of_simultaneous_bookings: false,
    });

    mockdate.reset();

  });

  it('should return correct answer for each class, when user has a valid membership with limited simultaneous bookings and no classes available', async () => {

    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'active',
      paid_until: '2019-05-15',
      archived: false,
    }).fetch();

    await MembershipType.update({id: fixtures.membershipTypeYogaUnlimited.id}, {
      has_max_number_of_simultaneous_bookings: true,
      max_number_of_simultaneous_bookings: 2,
    });

    const signups = await ClassSignup.createEach([
      {
        'class': yogaClass1.id, // date: '2019-05-15', start_time: '10:00:00'
        user: fixtures.userAlice.id,
        used_membership: membership.id,
      },
      {
        'class': yogaClass2.id, // date: '2019-05-16', start_time: '10:00:00'
        user: fixtures.userAlice.id,
        used_membership: membership.id,
      },
      {
        'class': yogaClass3.id, // date: '2019-05-16', start_time: '16:00:00',
        user: fixtures.userAlice.id,
        used_membership: membership.id,
      },
      {
        'class': yogaClassWeekAfter.id, // date: '2019-05-20', start_time: '00:00:00',
        user: fixtures.userAlice.id,
        used_membership: membership.id,
      },
    ]);

    let workingCopy = _.cloneDeep(allClasses);

    mockdate.set(moment.tz('2019-05-16 10:00:00', 'Europe/Copenhagen')); // Class has just started, so next class is released

    await sails.helpers.populate.classes.userHasAccessToClass(workingCopy, fixtures.userAlice);

    assert.deepStrictEqual(
      _.map(workingCopy, 'user_has_access_to_class'),
      [false, false, false, false, false, false, false, false],
    );

    await Membership.destroy({id: membership.id});
    await ClassSignup.destroy({id: _.map(signups, 'id')});
    await MembershipType.update({id: fixtures.membershipTypeYogaUnlimited.id}, {
      has_max_number_of_simultaneous_bookings: false,
    });

    mockdate.reset();

  });

  it('should return correct answer for each class, when user has a valid class pass with limited simultaneous bookings and still classes available', async () => {

    const classPass = await ClassPass.create({
      user: fixtures.userAlice.id,
      class_pass_type: fixtures.classPassTypeYogaTenClasses.id,
      classes_left: 8,
      valid_until: '2019-07-01',
      archived: false,
    }).fetch();

    await ClassPassType.update({id: fixtures.classPassTypeYogaTenClasses.id}, {
      has_max_number_of_simultaneous_bookings: true,
      max_number_of_simultaneous_bookings: 2,
    });

    const signups = await ClassSignup.createEach([
      {
        'class': yogaClass1.id, // date: '2019-05-15', start_time: '10:00:00'
        user: fixtures.userAlice.id,
        used_class_pass: classPass.id,
      },
      {
        'class': yogaClass2.id, // date: '2019-05-16', start_time: '10:00:00'
        user: fixtures.userAlice.id,
        used_class_pass: classPass.id,
      },
      {
        'class': yogaClass3.id, // date: '2019-05-16', start_time: '16:00:00',
        user: fixtures.userAlice.id,
        used_class_pass: classPass.id,
      },
      {
        'class': yogaClassWeekAfter.id, // date: '2019-05-20', start_time: '00:00:00',
        user: fixtures.userAlice.id,
      },
    ]);

    let workingCopy = _.cloneDeep(allClasses);

    mockdate.set(moment.tz('2019-05-16 10:00:00', 'Europe/Copenhagen')); // Class has just started, so next class is released

    await sails.helpers.populate.classes.userHasAccessToClass(workingCopy, fixtures.userAlice);

    assert.deepStrictEqual(
      _.map(workingCopy, 'user_has_access_to_class'),
      [true, true, true, true, true, true, true, false],
    );

    await ClassPass.destroy({id: classPass.id});
    await ClassSignup.destroy({id: _.map(signups, 'id')});
    await ClassPassType.update({id: fixtures.classPassTypeYogaTenClasses.id}, {
      has_max_number_of_simultaneous_bookings: false,
    });

    mockdate.reset();

  });

  it('should return correct answer for each class, when user has a valid class pass with limited simultaneous bookings and no classes available', async () => {

    const classPass = await ClassPass.create({
      user: fixtures.userAlice.id,
      class_pass_type: fixtures.classPassTypeYogaTenClasses.id,
      classes_left: 8,
      valid_until: '2019-07-01',
      archived: false,
    }).fetch();

    await ClassPassType.update({id: fixtures.classPassTypeYogaTenClasses.id}, {
      has_max_number_of_simultaneous_bookings: true,
      max_number_of_simultaneous_bookings: 2,
    });

    const signups = await ClassSignup.createEach([
      {
        'class': yogaClass1.id, // date: '2019-05-15', start_time: '10:00:00'
        user: fixtures.userAlice.id,
        used_class_pass: classPass.id,
      },
      {
        'class': yogaClass2.id, // date: '2019-05-16', start_time: '10:00:00'
        user: fixtures.userAlice.id,
        used_class_pass: classPass.id,
      },
      {
        'class': yogaClass3.id, // date: '2019-05-16', start_time: '16:00:00',
        user: fixtures.userAlice.id,
        used_class_pass: classPass.id,
      },
      {
        'class': yogaClassWeekAfter.id, // date: '2019-05-20', start_time: '00:00:00',
        user: fixtures.userAlice.id,
        used_class_pass: classPass.id,
      },
    ]);

    let workingCopy = _.cloneDeep(allClasses);

    mockdate.set(moment.tz('2019-05-16 10:00:00', 'Europe/Copenhagen')); // Class has just started, so next class is released

    await sails.helpers.populate.classes.userHasAccessToClass(workingCopy, fixtures.userAlice);

    assert.deepStrictEqual(
      _.map(workingCopy, 'user_has_access_to_class'),
      [false, false, false, false, false, false, false, false],
    );

    await ClassPass.destroy({id: classPass.id});
    await ClassSignup.destroy({id: _.map(signups, 'id')});
    await ClassPassType.update({id: fixtures.classPassTypeYogaTenClasses.id}, {
      has_max_number_of_simultaneous_bookings: false,
    });

    mockdate.reset();

  });

  it('should count livestream signups and waiting list signups towards weekly limit', async () => {

    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      membership_type: fixtures.membershipTypeYogaTwoClassesPerWeek.id,
      status: 'active',
      paid_until: '2019-05-15',
      archived: false,
    }).fetch();

    const classInQuestion = await Class.create(
      {
        client: testClientId,
        date: '2019-05-13',
        start_time: '00:00:00',
        end_time: '02:00:00',
        class_type: fixtures.classTypeYoga.id,
        seats: 20,
      },
    ).fetch();

    const classesThatShouldCountTowardLimit = await Class.createEach([
      {
        client: testClientId,
        date: '2019-05-13',
        start_time: '00:00:00',
        end_time: '02:00:00',
        class_type_id: fixtures.classTypeYoga.id,
        seats: 20,
      },
      {
        client: testClientId,
        date: '2019-05-19',
        start_time: '23:59:59',
        end_time: '02:00:00',
        class_type_id: fixtures.classTypeYoga.id,
        seats: 20,
      },
    ]).fetch();

    const livestreamSignupThatShouldCountTowardsLimit = await ClassLivestreamSignup.create(
      {
        class: classesThatShouldCountTowardLimit[0].id,
        user: fixtures.userAlice.id,
        used_membership: membership.id,
      },
    ).fetch();

    const waitingListSignupThatShouldCountTowardsLimit = await ClassWaitingListSignup.create(
      {
        class: classesThatShouldCountTowardLimit[1].id,
        user: fixtures.userAlice.id,
        used_membership: membership.id,
      },
    ).fetch();

    await sails.helpers.populate.classes.userHasAccessToClass([classInQuestion], fixtures.userAlice);

    assert.strictEqual(
      classInQuestion.user_has_access_to_class,
      false,
    );

    await Class.destroy({id: _.map(_.concat(classesThatShouldCountTowardLimit, [classInQuestion]), 'id')});
    await Membership.destroy({id: membership.id});
    await ClassLivestreamSignup.destroy({id: livestreamSignupThatShouldCountTowardsLimit.id});
    await ClassWaitingListSignup.destroy({id: waitingListSignupThatShouldCountTowardsLimit.id});

  });

  it('should count waiting list signups towards max future bookings limit', async () => {

    const classPass = await ClassPass.create({
      user: fixtures.userAlice.id,
      class_pass_type: fixtures.classPassTypeYogaTenClasses.id,
      classes_left: 8,
      valid_until: '2019-07-01',
      archived: false,
    }).fetch();

    await ClassPassType.update({id: fixtures.classPassTypeYogaTenClasses.id}, {
      has_max_number_of_simultaneous_bookings: true,
      max_number_of_simultaneous_bookings: 2,
    });

    const classInQuestion = await Class.create(
      {
        client: testClientId,
        date: '2019-05-13',
        start_time: '00:00:00',
        end_time: '02:00:00',
        class_type: fixtures.classTypeYoga.id,
        seats: 20,
      },
    ).fetch();

    const classesThatShouldCountTowardLimit = await Class.createEach([
      {
        client: testClientId,
        date: '2019-05-13',
        start_time: '00:00:00',
        end_time: '02:00:00',
        class_type_id: fixtures.classTypeYoga.id,
        seats: 20,
      },
      {
        client: testClientId,
        date: '2019-05-19',
        start_time: '23:59:59',
        end_time: '02:00:00',
        class_type_id: fixtures.classTypeYoga.id,
        seats: 20,
      },
    ]).fetch();

    const waitingListSignupsThatShouldCountTowardsLimit = await ClassWaitingListSignup.createEach([
      {
        class: classesThatShouldCountTowardLimit[0].id,
        user: fixtures.userAlice.id,
        used_class_pass: classPass.id,
      },
      {
        class: classesThatShouldCountTowardLimit[1].id,
        user: fixtures.userAlice.id,
        used_class_pass: classPass.id,
      }]
    ).fetch();


    mockdate.set(moment.tz('2019-05-10 10:00:00', 'Europe/Copenhagen'));

    await sails.helpers.populate.classes.userHasAccessToClass([classInQuestion], fixtures.userAlice);

    assert.deepStrictEqual(
      classInQuestion.user_has_access_to_class,
      false,
    );

    await ClassPass.destroy({id: classPass.id});
    await ClassPassType.update({id: fixtures.classPassTypeYogaTenClasses.id}, {
      has_max_number_of_simultaneous_bookings: false,
    });
    await Class.destroy({id: _.map(_.concat([classInQuestion], classesThatShouldCountTowardLimit), 'id')});
    await ClassWaitingListSignup.destroy({id: _.map(waitingListSignupsThatShouldCountTowardsLimit, 'id')});

    mockdate.reset();

  });

  it('should return false for classes affected by membership pause', async () => {

    const classes = await Class.createEach([
      {
        client: testClientId,
        class_type: fixtures.classTypeYoga.id,
        date: '2020-05-01',
        start_time: '23:59:59',
        end_time: '02:00:00',
      },
      {
        client: testClientId,
        class_type: fixtures.classTypeYoga.id,
        date: '2020-05-02',
        start_time: '00:00:00',
        end_time: '02:00:00',
      },
      {
        client: testClientId,
        class_type: fixtures.classTypeYoga.id,
        date: '2020-05-02',
        start_time: '23:59:59',
        end_time: '02:00:00',
      },
      {
        client: testClientId,
        class_type: fixtures.classTypeYoga.id,
        date: '2020-05-03',
        start_time: '00:00:00',
        end_time: '02:00:00',
      }
    ]).fetch();

    const membership = await Membership.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      status: 'active',
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
    }).fetch();
    const membershipPause = await MembershipPause.create({
      membership_id: membership.id,
      client_id: testClientId,
      start_date:'2020-05-02',
      end_date: '2020-05-03'
    }).fetch();

    await sails.helpers.populate.classes.userHasAccessToClass(classes, fixtures.userAlice);

    expect(classes).to.matchPattern(`
    [
      {
        user_has_access_to_class: true,
        ...
      },
      {
        user_has_access_to_class: false,
        ...
      },
      {
        user_has_access_to_class: false,
        ...
      },
      {
        user_has_access_to_class: true,
        ...
      }
    ]`);

    await Class.destroy({id: _.map(classes, 'id')});
    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: membershipPause.id});

  })

  it('should return false for classes affected by membership pause without end date', async () => {

    const classes = await Class.createEach([
      {
        client: testClientId,
        class_type: fixtures.classTypeYoga.id,
        date: '2020-05-01',
        start_time: '23:59:59',
        end_time: '02:00:00',
      },
      {
        client: testClientId,
        class_type: fixtures.classTypeYoga.id,
        date: '2020-05-02',
        start_time: '00:00:00',
        end_time: '02:00:00',
      },
      {
        client: testClientId,
        class_type: fixtures.classTypeYoga.id,
        date: '2020-05-02',
        start_time: '23:59:59',
        end_time: '02:00:00',
      },
      {
        client: testClientId,
        class_type: fixtures.classTypeYoga.id,
        date: '2020-05-03',
        start_time: '00:00:00',
        end_time: '02:00:00',
      }
    ]).fetch();

    const membership = await Membership.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      status: 'active',
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
    }).fetch();
    const membershipPause = await MembershipPause.create({
      client: testClientId,
      membership_id: membership.id,
      client_id: testClientId,
      start_date:'2020-05-02',
    }).fetch();

    await sails.helpers.populate.classes.userHasAccessToClass(classes, fixtures.userAlice);

    expect(classes).to.matchPattern(`
    [
      {
        user_has_access_to_class: true,
        ...
      },
      {
        user_has_access_to_class: false,
        ...
      },
      {
        user_has_access_to_class: false,
        ...
      },
      {
        user_has_access_to_class: false,
        ...
      }
    ]`);

    await Class.destroy({id: _.map(classes, 'id')});
    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: membershipPause.id});

  })

});


