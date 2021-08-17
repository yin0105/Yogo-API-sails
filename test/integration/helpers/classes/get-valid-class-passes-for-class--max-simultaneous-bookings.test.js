const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID;
const fixtures = require('../../../fixtures/factory').fixtures;
const mockdate = require('mockdate');
const moment = require('moment-timezone');

describe('get-valid-class-passes-for-class--max-simultaneous-bookings', async function () {

  let
    yogaClass1,
    yogaClass2,
    yogaClass3,
    yogaClass4,
    yogaClass5;

  before(async () => {

    await Class.destroy({});
    await ClassPass.destroy({});

    yogaClass1 = await Class.create({
      class_type: fixtures.classTypeYoga.id,
      date: '2018-05-14',
      start_time: '09:00:00',
      end_time: '11:00:00',
      client: testClientId,
      seats: 15,
      archived: false,
      cancelled: false,
    }).fetch();

    yogaClass2 = await Class.create({
      class_type: fixtures.classTypeYoga.id,
      date: '2018-05-15',
      start_time: '10:00:00',
      end_time: '12:00:00',
      client: testClientId,
      seats: 15,
      archived: false,
      cancelled: false,
    }).fetch();

    yogaClass3 = await Class.create({
      class_type: fixtures.classTypeYoga.id,
      date: '2018-05-15',
      start_time: '16:00:00',
      end_time: '18:00:00',
      client: testClientId,
      seats: 15,
      archived: false,
      cancelled: false,
    }).fetch();

    yogaClass4 = await Class.create({
      class_type: fixtures.classTypeYoga.id,
      date: '2018-05-16',
      start_time: '16:00:00',
      end_time: '18:00:00',
      client: testClientId,
      seats: 15,
      archived: false,
      cancelled: false,
    }).fetch();

    yogaClass5 = await Class.create({
      class_type: fixtures.classTypeYoga.id,
      date: '2018-05-20',
      start_time: '16:00:00',
      end_time: '18:00:00',
      client: testClientId,
      seats: 15,
      archived: false,
      cancelled: false,
    }).fetch();

  });

  after(async () => {
    await Class.destroy({id: [yogaClass1.id, yogaClass2.id, yogaClass3.id, yogaClass4.id, yogaClass5.id]});
  });

  it('should return class passes with max number of simultaneous bookings if customer has no bookings', async () => {

    const classPass = await ClassPass.create({
      user: fixtures.userAlice.id,
      class_pass_type: fixtures.classPassTypeYogaTenClasses.id,
      classes_left: 8,
      valid_until: '2019-01-01',
    }).fetch();

    await ClassPassType.update({id: fixtures.classPassTypeYogaTenClasses.id}, {
      has_max_number_of_simultaneous_bookings: true,
      max_number_of_simultaneous_bookings: 2,
    });

    mockdate.set(moment.tz('2018-05-15 10:00:00', 'Europe/Copenhagen'));

    const validClassPasses = await sails.helpers.classes.getValidClassPassesForClass.with({
      user: fixtures.userAlice,
      classItem: yogaClass3,
      includeAlreadyUsedClassPasses: true
    });

    expect(validClassPasses).to.matchPattern(
      `[
        {
          id: ${classPass.id},
          ...
        }
      ]`,
    );

    await ClassPass.destroy({id: classPass.id});

    await ClassPassType.update({id: fixtures.classPassTypeYogaTenClasses.id}, {
      has_max_number_of_simultaneous_bookings: false,
    });

    mockdate.reset();

  });

  it('should return class passes that have not reached their limit of future signups', async () => {

    const classPass = await ClassPass.create({
      user: fixtures.userAlice.id,
      class_pass_type: fixtures.classPassTypeYogaTenClasses.id,
      classes_left: 8,
      valid_until: '2019-01-01',
    }).fetch();

    await ClassPassType.update({id: fixtures.classPassTypeYogaTenClasses.id}, {
      has_max_number_of_simultaneous_bookings: true,
      max_number_of_simultaneous_bookings: 2,
    });

    const signups = await ClassSignup.createEach([
      {
        'class': yogaClass1.id,
        user: fixtures.userAlice.id,
        used_class_pass: classPass.id,
        archived: false,
      },
      {
        'class': yogaClass2.id,
        user: fixtures.userAlice.id,
        used_class_pass: classPass.id,
        archived: false,
      },
      {
        'class': yogaClass4.id,
        user: fixtures.userAlice.id,
        used_class_pass: classPass.id,
        archived: false,
      },
      {
        'class': yogaClass5.id,
        user: fixtures.userAlice.id,
        archived: false,
      },
    ]).fetch();

    mockdate.set(moment.tz('2018-05-15 10:00:00', 'Europe/Copenhagen'));

    const validClassPasses = await sails.helpers.classes.getValidClassPassesForClass.with({
      user: fixtures.userAlice,
      classItem: yogaClass3,
      includeAlreadyUsedClassPasses: true
    });

    expect(validClassPasses).to.matchPattern(
      `[
        {
          id: ${classPass.id},
          ...
        }
      ]`,
    );

    await ClassPass.destroy({id: classPass.id});
    await ClassSignup.destroy({id: _.map(signups, 'id')});

    await ClassPassType.update({id: fixtures.classPassTypeYogaTenClasses.id}, {
      has_max_number_of_simultaneous_bookings: false,
    });

    mockdate.reset();

  });

  it('should not return class passes that have reached their limit of future signups', async () => {

    const classPass = await ClassPass.create({
      user: fixtures.userAlice.id,
      class_pass_type: fixtures.classPassTypeYogaTenClasses.id,
      classes_left: 8,
      valid_until: '2019-01-01',
    }).fetch();

    await ClassPassType.update({id: fixtures.classPassTypeYogaTenClasses.id}, {
      has_max_number_of_simultaneous_bookings: true,
      max_number_of_simultaneous_bookings: 2,
    });

    const signups = await ClassSignup.createEach([
      {
        'class': yogaClass4.id,
        user: fixtures.userAlice.id,
        used_class_pass: classPass.id,
        archived: false,
      },
      {
        'class': yogaClass5.id,
        user: fixtures.userAlice.id,
        used_class_pass: classPass.id,
        archived: false,
      },
    ]).fetch();

    mockdate.set(moment.tz('2018-05-15 10:00:00', 'Europe/Copenhagen'));

    const validClassPasses = await sails.helpers.classes.getValidClassPassesForClass.with({
      user: fixtures.userAlice,
      classItem: yogaClass3,
      includeAlreadyUsedClassPasses: true
    });

    expect(validClassPasses).to.matchPattern([]);

    await ClassPass.destroy({id: classPass.id});
    await ClassSignup.destroy({id: _.map(signups, 'id')});

    await ClassPassType.update({id: fixtures.classPassTypeYogaTenClasses.id}, {
      has_max_number_of_simultaneous_bookings: false,
    });

    mockdate.reset();

  });

  it('should not return class passes that have reached their limit of future signups, but still return other class passes', async () => {

    const classPass = await ClassPass.create({
      user: fixtures.userAlice.id,
      class_pass_type: fixtures.classPassTypeYogaTenClasses.id,
      classes_left: 8,
      valid_until: '2019-01-01',
    }).fetch();

    await ClassPassType.update({id: fixtures.classPassTypeYogaTenClasses.id}, {
      has_max_number_of_simultaneous_bookings: true,
      max_number_of_simultaneous_bookings: 2,
    });

    const classPass2 = await ClassPass.create({
      user: fixtures.userAlice.id,
      class_pass_type: fixtures.classPassTypeYogaUnlimitedOneMonth.id,
      valid_until: '2019-01-01',
    }).fetch();

    const signups = await ClassSignup.createEach([
      {
        'class': yogaClass4.id,
        user: fixtures.userAlice.id,
        used_class_pass: classPass.id,
        archived: false,
      },
      {
        'class': yogaClass5.id,
        user: fixtures.userAlice.id,
        used_class_pass: classPass.id,
        archived: false,
      },
    ]).fetch();

    mockdate.set(moment.tz('2018-05-15 10:00:00', 'Europe/Copenhagen'));

    const validClassPasses = await sails.helpers.classes.getValidClassPassesForClass.with({
      user: fixtures.userAlice,
      classItem: yogaClass3,
      includeAlreadyUsedClassPasses: true
    });

    expect(validClassPasses).to.matchPattern(`[
      {
        id: ${classPass2.id},
        ... 
      }
    ]`);

    await ClassPass.destroy({id: [classPass.id, classPass2.id]});
    await ClassSignup.destroy({id: _.map(signups, 'id')});

    await ClassPassType.update({id: fixtures.classPassTypeYogaTenClasses.id}, {
      has_max_number_of_simultaneous_bookings: false,
    });

    mockdate.reset();

  });

});
