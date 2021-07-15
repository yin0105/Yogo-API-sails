const assert = require('assert');
const assertAsyncThrows = require('../../../utils/assert-async-throws');

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID;
const fixtures = require('../../../fixtures/factory').fixtures;

const compareNumbers = function (a, b) {
  return a - b;
};

describe('get-valid-class-passes-for-livestream', async function () {

  let classPassUnlimitedYogaValid,
    classPassFixedCountYogaValid,
    classPassUnlimitedYogaArchived,
    classPassTenYogaClassesExpired,
    classPassTenYogaClassesWithNoClassesLeft,
    classPassTenDanceClasses,
    classPassTenYogaClassesUserBill,

    yogaClass1,

    signupWithClassPass,
    archivedSignupWithFixedCountClassPass,
    cancelledSignupWithFixedCountClassPass;


  before(async () => {
    // SET UP CLASS PASSES
    classPassUnlimitedYogaValid = await ClassPass.create({
      class_pass_type: fixtures.classPassTypeYogaUnlimitedOneMonthLivestream.id,
      valid_until: '2018-05-20',
      client: testClientId,
      user: fixtures.userAlice.id,
    }).fetch();

    classPassFixedCountYogaValid = await ClassPass.create({
      class_pass_type: fixtures.classPassTypeYogaTenClassesLivestream.id,
      classes_left: 4,
      valid_until: '2018-05-20',
      client: testClientId,
      user: fixtures.userAlice.id,
    }).fetch();

    classPassUnlimitedYogaArchived = await ClassPass.create({
      class_pass_type: fixtures.classPassTypeYogaUnlimitedOneMonthLivestream.id,
      valid_until: '2018-05-20',
      client: testClientId,
      user: fixtures.userAlice.id,
      archived: true,
    }).fetch();


    classPassTenYogaClassesExpired = await ClassPass.create({
      class_pass_type: fixtures.classPassTypeYogaTenClassesLivestream.id,
      valid_until: '2018-04-20',
      classes_left: 10,
      client: testClientId,
      user: fixtures.userAlice.id,
    }).fetch();

    classPassTenYogaClassesWithNoClassesLeft = await ClassPass.create({
      class_pass_type: fixtures.classPassTypeYogaTenClassesLivestream.id,
      valid_until: '2018-05-20',
      classes_left: 0,
      client: testClientId,
      user: fixtures.userAlice.id,
    }).fetch();

    classPassTenDanceClasses = await ClassPass.create({
      class_pass_type: fixtures.classPassTypeDanceTenClasses.id,
      valid_until: '2018-05-20',
      classes_left: 8,
      client: testClientId,
      user: fixtures.userAlice.id,
    }).fetch();


    classPassTenYogaClassesUserBill = await ClassPass.create({
      class_pass_type: fixtures.classPassTypeYogaTenClassesLivestream.id, // Yoga ten classes
      valid_until: '2018-05-25',
      classes_left: 5,
      client: testClientId,
      user: fixtures.userBill.id,
    }).fetch();


    // SET UP CLASSES
    yogaClass1 = await Class.create({
      class_type: fixtures.classTypeYoga.id,
      date: '2018-05-15',
      start_time: '10:00:00',
      end_time: '12:00:00',
      client: testClientId,
      seats: 15,
    }).fetch();


    // SET UP SIGNUPS
    signupWithClassPass = await ClassLivestreamSignup.create({
      'class': yogaClass1.id,
      user: fixtures.userAlice.id,
      used_class_pass: classPassUnlimitedYogaValid.id,
    }).fetch();

    archivedSignupWithFixedCountClassPass = await ClassLivestreamSignup.create({
      'class': yogaClass1.id,
      user: fixtures.userAlice.id,
      used_class_pass: classPassFixedCountYogaValid.id,
      archived: true,
    }).fetch();

    cancelledSignupWithFixedCountClassPass = await ClassLivestreamSignup.create({
      'class': yogaClass1.id,
      user: fixtures.userAlice.id,
      used_class_pass: classPassFixedCountYogaValid.id,
      cancelled_at: Date.now(),
    }).fetch();
  });

  after(async () => {
    await ClassPass.destroy({
      id: [
        classPassUnlimitedYogaValid.id,
        classPassFixedCountYogaValid.id,
        classPassUnlimitedYogaArchived.id,
        classPassTenYogaClassesExpired.id,
        classPassTenYogaClassesWithNoClassesLeft.id,
        classPassTenDanceClasses.id,
        classPassTenYogaClassesUserBill.id,
      ],
    });

    await Class.destroy({id: [yogaClass1.id]});
    await ClassLivestreamSignup.destroy({id: [signupWithClassPass.id, archivedSignupWithFixedCountClassPass.id, cancelledSignupWithFixedCountClassPass.id]});
  });


  it('should throw "classNotFound" if class is not in the database. Test with ID input.', async () => {

    await assertAsyncThrows(
      async () => {
        await sails.helpers.classes.getValidClassPassesForLivestream.with({
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
        await sails.helpers.classes.getValidClassPassesForLivestream.with({
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
        await sails.helpers.classes.getValidClassPassesForLivestream.with({
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

  it('should return an array of class passes valid for the specified class.', async () => {

    let validClassPasses = await sails.helpers.classes.getValidClassPassesForLivestream.with({
      user: fixtures.userAlice,
      classItem: yogaClass1,
    });

    const validClassPassIds = _.map(validClassPasses, 'id');

    validClassPassIds.sort(compareNumbers);

    assert.deepEqual(
      validClassPassIds,
      [classPassFixedCountYogaValid.id],
    );

  });


  /*it('should exclude class passes that have reached their limit of future signups', async () => {

    mockdate.set(moment.tz('2020-12-06', 'Europe/Copenhagen'));

    const classInQuestion = await Class.create({
      client: testClientId,
      date: '2020-12-08',
      start_time: '12:00:00',
      end_time: '14:00:00',
      class_type: fixtures.classTypeYoga.id,
    }).fetch();

    const classesToCountTowardsLimit = await Class.createEach([
      {
        client: testClientId,
        date: '2020-12-07',
        start_time: '00:00:00',
        end_time: '02:00:00',
        class_type: fixtures.classTypeYoga.id,
      },
      {
        client: testClientId,
        date: '2020-12-14',
        start_time: '00:00:00',
        end_time: '02:00:00',
        class_type: fixtures.classTypeYoga.id,
      },
    ]).fetch();

    const classPassTwoClassesPerWeek = await ClassPass.create({
      client: testClientId,
      user: fixtures.userDennis.id,
      class_pass_type: fixtures.classPassTypeYogaUnlimitedOneMonthLivestream.id,
      valid_until: '2020-12-31',
    }).fetch();

    await ClassPassType.update({id: fixtures.classPassTypeYogaUnlimitedOneMonthLivestream.id}, {
      has_max_number_of_simultaneous_bookings: true,
      max_number_of_simultaneous_bookings: 2,
    });

    const signupsToCountTowardsLimit = await ClassLivestreamSignup.createEach([
      {
        class: classesToCountTowardsLimit[0].id,
        user: fixtures.userDennis.id,
        used_class_pass: classPassTwoClassesPerWeek.id,
      },
      {
        class: classesToCountTowardsLimit[1].id,
        user: fixtures.userDennis.id,
        used_class_pass: classPassTwoClassesPerWeek.id,
      },
    ]).fetch();

    const classPassNoLimit = await ClassPass.create({
      client: testClientId,
      user: fixtures.userDennis.id,
      class_pass_type: fixtures.classPassTypeYogaTenClassesLivestream.id,
      classes_left: 10,
      valid_until: '2020-12-31',
    }).fetch();

    let validClassPasses = await sails.helpers.classes.getValidClassPassesForLivestream.with({
      user: fixtures.userDennis,
      classItem: classInQuestion,
    });

    assert.deepStrictEqual(
      _.map(validClassPasses, 'id'),
      [classPassNoLimit.id],
    );

    await Class.destroy({id: _.map(_.concat([classInQuestion], classesToCountTowardsLimit), 'id')});
    await ClassPass.destroy({id: [classPassTwoClassesPerWeek.id, classPassNoLimit.id]});
    await ClassPassType.update({id: fixtures.classPassTypeYogaUnlimitedOneMonth.id}, {has_max_number_of_simultaneous_bookings: false});
    await ClassLivestreamSignup.destroy({id: _.map(signupsToCountTowardsLimit, 'id')});
    mockdate.reset();

  });

  it('should return class passes that have not reached their limit of future signups', async () => {

    mockdate.set(moment.tz('2020-12-06 12:00:00', 'Europe/Copenhagen'));

    const classInQuestion = await Class.create({
      client: testClientId,
      date: '2020-12-08',
      start_time: '12:00:00',
      end_time: '14:00:00',
      class_type: fixtures.classTypeYoga.id,
    }).fetch();

    const classesToCountTowardsLimit = await Class.createEach([
      {
        client: testClientId,
        date: '2020-12-07',
        start_time: '00:00:00',
        end_time: '02:00:00',
        class_type: fixtures.classTypeYoga.id,
      },
    ]).fetch();

    const classesToNotCountTowardsLimit = await Class.createEach([
      {
        client: testClientId,
        date: '2020-12-06',
        start_time: '12:00:00', // Classes are not counted as soon as they have started
        end_time: '14:00:00',
        class_type: fixtures.classTypeYoga.id,
      },
      {
        client: testClientId,
        date: '2020-12-08',
        start_time: '12:00:00',
        end_time: '14:00:00',
        class_type: fixtures.classTypeYoga.id,
        archived: true,
      },
      {
        client: testClientId,
        date: '2020-12-08',
        start_time: '12:00:00',
        end_time: '14:00:00',
        class_type: fixtures.classTypeYoga.id,
        cancelled: true,
      },
    ]).fetch();

    const classPass = await ClassPass.create({
      client: testClientId,
      user: fixtures.userDennis.id,
      class_pass_type: fixtures.classPassTypeYogaUnlimitedOneMonthLivestream.id,
      valid_until: '2020-12-31',
    }).fetch();

    await ClassPassType.update({id: fixtures.classPassTypeYogaUnlimitedOneMonthLivestream.id}, {
      has_max_number_of_simultaneous_bookings: true,
      max_number_of_simultaneous_bookings: 2,
    });

    const signupsToCountTowardsLimit = await ClassLivestreamSignup.createEach([
      {
        class: classesToCountTowardsLimit[0].id,
        user: fixtures.userDennis.id,
        used_class_pass: classPass.id,
      },
    ]).fetch();

    const signupsToNotCountTowardsLimit = await ClassLivestreamSignup.createEach(_.map(classesToNotCountTowardsLimit, cl => ({
      class: cl.id,
      user: fixtures.userDennis.id,
      used_class_pass: classPass.id,
    }))).fetch();

    let validClassPasses = await sails.helpers.classes.getValidClassPassesForLivestream.with({
      user: fixtures.userDennis,
      classItem: classInQuestion,
    });

    assert.deepStrictEqual(
      _.map(validClassPasses, 'id'),
      [classPass.id],
    );

    await Class.destroy({id: _.map(_.concat([classInQuestion], classesToCountTowardsLimit, classesToNotCountTowardsLimit), 'id')});
    await ClassPass.destroy({id: classPass.id});
    await ClassPassType.update({id: fixtures.classPassTypeYogaUnlimitedOneMonth.id}, {has_max_number_of_simultaneous_bookings: false});
    await ClassLivestreamSignup.destroy({id: _.map(_.concat(signupsToCountTowardsLimit, signupsToNotCountTowardsLimit), 'id')});
    mockdate.reset();

  });*/

});
