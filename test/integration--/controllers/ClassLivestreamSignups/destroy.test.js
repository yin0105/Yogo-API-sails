const supertest = require('supertest');

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID;
const fixtures = require('../../../fixtures/factory').fixtures;

const comparePartialObject = require('../../../utils/compare-partial-object');

const {authorizeAdmin, authorizeUserBill, authorizeTeacherEvelyn, authorizeTeacherFiona} = require('../../../utils/request-helpers');

const moment = require('moment-timezone');

const MockDate = require('mockdate');


describe('controllers.ClassLivestreamSignups.destroy', () => {

  let class1;

  before(async () => {
    class1 = await Class.create({
      date: '2018-05-15',
      start_time: '10:00:00',
      end_time: '12:00:00',
      client: testClientId,
      class_type: fixtures.classTypeYoga.id,
      seats: 1,
      teachers: [fixtures.userEvelyn.id],
    }).fetch();

  });

  after(async () => {
    await Class.destroy({
      id: class1.id,
    });
  });


  it('should set cancelled_at = Date.now() and refund class pass if one were used', async () => {

    const classPass = await ClassPass.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      class_pass_type: fixtures.classPassTypeYogaTenClassesLivestream.id,
      classes_left: 5,
      valid_until: '2018-05-31',
    }).fetch();

    const signup = await ClassLivestreamSignup.create({
      'class': class1.id,
      user: fixtures.userAlice.id,
      client: testClientId,
      used_class_pass: classPass.id,
    }).fetch();

    MockDate.set(moment.tz('2018-05-15 09:59:59', 'Europe/Copenhagen'));

    await supertest(sails.hooks.http.app)
      .delete(
        '/class-livestream-signups/' + signup.id +
        '?client=' + testClientId,
      )
      .set('Authorization', 'Bearer ' + fixtures.userAliceAccessToken)
      .expect(200);


    const updatedSignup = await ClassLivestreamSignup.findOne(signup.id);

    expect(updatedSignup).to.matchPattern(`
      {
        archived: false,
        cancelled_at: _.isGreaterThan|0,
        ...
      }`
    );

    const updatedClassPass = await ClassPass.findOne(classPass.id);

    comparePartialObject(
      updatedClassPass,
      {
        classes_left: 6,
      },
    );

    // Clean up
    await ClassLivestreamSignup.destroy({id: signup.id});
    await ClassPass.destroy({id: classPass.id});

    MockDate.reset();

  });

  it('should deny access if class has started and user is not admin', async () => {
    const classPass = await ClassPass.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      class_pass_type: fixtures.classPassTypeYogaTenClasses.id,
      classes_left: 5,
      valid_until: '2018-05-31',
    }).fetch();

    const signup = await ClassLivestreamSignup.create({
      'class': class1.id,
      user: fixtures.userAlice.id,
      client: testClientId,
      used_class_pass: classPass.id,
    }).fetch();

    MockDate.set(moment.tz('2018-05-15 10:00:00', 'Europe/Copenhagen'));

    await supertest(sails.hooks.http.app)
      .delete(
        '/class-livestream-signups/' + signup.id +
        '?client=' + testClientId,
      )
      .set('Authorization', 'Bearer ' + fixtures.userAliceAccessToken)
      .expect('E_CLASS_HAS_STARTED')
      .expect(200);

    // Clean up
    await ClassLivestreamSignup.destroy({id: signup.id});
    await ClassPass.destroy({id: classPass.id});

    MockDate.reset();
  });

  it('should allow access if class has started and it is still the same day and user is admin', async () => {
    const classPass = await ClassPass.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      class_pass_type: fixtures.classPassTypeYogaTenClasses.id,
      classes_left: 5,
      valid_until: '2018-05-31',
    }).fetch();

    const signup = await ClassLivestreamSignup.create({
      'class': class1.id,
      user: fixtures.userAlice.id,
      client: testClientId,
      used_class_pass: classPass.id,
    }).fetch();

    MockDate.set(moment.tz('2018-05-15 23:59:59', 'Europe/Copenhagen'));

    await supertest(sails.hooks.http.app)
      .delete(
        '/class-livestream-signups/' + signup.id +
        '?client=' + testClientId,
      )
      .use(authorizeAdmin())
      .expect(200);

    const updatedSignup = await ClassLivestreamSignup.findOne(signup.id);

    expect(updatedSignup).to.matchPattern(`{
      archived: false,
      cancelled_at: _.isGreaterThan|0,
      ...
    }`);

    const updatedClassPass = await ClassPass.findOne(classPass.id);

    expect(updatedClassPass.classes_left).to.equal(6);

    // Clean up
    await ClassLivestreamSignup.destroy({id: signup.id});
    await ClassPass.destroy({id: classPass.id});

    MockDate.reset();
  });

  it('should deny access if class has started and the day has passed and user is admin', async () => {
    const classPass = await ClassPass.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      class_pass_type: fixtures.classPassTypeYogaTenClasses.id,
      classes_left: 5,
      valid_until: '2018-05-31',
    }).fetch();

    const signup = await ClassLivestreamSignup.create({
      'class': class1.id,
      user: fixtures.userAlice.id,
      client: testClientId,
      used_class_pass: classPass.id,
    }).fetch();

    MockDate.set(moment.tz('2018-05-16 00:00:00', 'Europe/Copenhagen'));

    await supertest(sails.hooks.http.app)
      .delete(
        '/class-livestream-signups/' + signup.id +
        '?client=' + testClientId,
      )
      .use(authorizeAdmin())
      .expect('E_CLASS_HAS_STARTED')
      .expect(200);

    // Clean up
    await ClassLivestreamSignup.destroy({id: signup.id});
    await ClassPass.destroy({id: classPass.id});

    MockDate.reset();
  });

  it('should deny access if customer tries to destroy signup for another customer', async () => {
    const classPass = await ClassPass.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      class_pass_type: fixtures.classPassTypeYogaTenClasses.id,
      classes_left: 5,
      valid_until: '2018-05-31',
    }).fetch();

    const signup = await ClassLivestreamSignup.create({
      'class': class1.id,
      user: fixtures.userAlice.id,
      client: testClientId,
      used_class_pass: classPass.id,
    }).fetch();

    MockDate.set(moment.tz('2018-05-14 09:00:00', 'Europe/Copenhagen'));

    await supertest(sails.hooks.http.app)
      .delete(
        '/class-livestream-signups/' + signup.id +
        '?client=' + testClientId,
      )
      .use(authorizeUserBill())
      .expect(403);

    // Clean up
    await ClassLivestreamSignup.destroy({id: signup.id});
    await ClassPass.destroy({id: classPass.id});

    MockDate.reset();
  });

  it('should deny access for teacher, if teacher is not teaching the class', async () => {
    const classPass = await ClassPass.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      class_pass_type: fixtures.classPassTypeYogaTenClasses.id,
      classes_left: 5,
      valid_until: '2018-05-31',
    }).fetch();

    const signup = await ClassLivestreamSignup.create({
      'class': class1.id,
      user: fixtures.userAlice.id,
      client: testClientId,
      used_class_pass: classPass.id,
    }).fetch();

    MockDate.set(moment.tz('2018-05-15 08:00:00', 'Europe/Copenhagen'));

    await supertest(sails.hooks.http.app)
      .delete(
        '/class-livestream-signups/' + signup.id +
        '?client=' + testClientId,
      )
      .use(authorizeTeacherFiona())
      .expect(403);


    // Clean up
    await ClassLivestreamSignup.destroy({id: signup.id});
    await ClassPass.destroy({id: classPass.id});

    MockDate.reset();
  });

  it('should allow access same day for teacher if teacher is teaching the class', async () => {
    const classPass = await ClassPass.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      class_pass_type: fixtures.classPassTypeYogaTenClasses.id,
      classes_left: 5,
      valid_until: '2018-05-31',
    }).fetch();

    const signup = await ClassLivestreamSignup.create({
      'class': class1.id,
      user: fixtures.userAlice.id,
      client: testClientId,
      used_class_pass: classPass.id,
    }).fetch();

    MockDate.set(moment.tz('2018-05-15 23:59:59', 'Europe/Copenhagen'));

    await supertest(sails.hooks.http.app)
      .delete(
        '/class-livestream-signups/' + signup.id +
        '?client=' + testClientId,
      )
      .use(authorizeTeacherEvelyn())
      .expect(200);


    const updatedSignup = await ClassLivestreamSignup.findOne(signup.id);

    expect(updatedSignup).to.matchPattern(`{
      archived: false,
      cancelled_at: _.isGreaterThan|0,
      ...
    }`);

    const updatedClassPass = await ClassPass.findOne(classPass.id);

    expect(updatedClassPass.classes_left).to.equal(6);

    // Clean up
    await ClassLivestreamSignup.destroy({id: signup.id});
    await ClassPass.destroy({id: classPass.id});

    MockDate.reset();
  });

  it('should deny access the day after for teacher, even if teacher is teaching the class', async () => {
    const classPass = await ClassPass.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      class_pass_type: fixtures.classPassTypeYogaTenClasses.id,
      classes_left: 5,
      valid_until: '2018-05-31',
    }).fetch();

    const signup = await ClassLivestreamSignup.create({
      'class': class1.id,
      user: fixtures.userAlice.id,
      client: testClientId,
      used_class_pass: classPass.id,
    }).fetch();

    MockDate.set(moment.tz('2018-05-16 00:00:00', 'Europe/Copenhagen'));

    await supertest(sails.hooks.http.app)
      .delete(
        '/class-livestream-signups/' + signup.id +
        '?client=' + testClientId,
      )
      .use(authorizeTeacherEvelyn())
      .expect('E_CLASS_HAS_STARTED');


    // Clean up
    await ClassLivestreamSignup.destroy({id: signup.id});
    await ClassPass.destroy({id: classPass.id});

    MockDate.reset();
  });

  it('should allow access same day for teacher if teacher has access to manage all classes', async () => {
    const classPass = await ClassPass.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      class_pass_type: fixtures.classPassTypeYogaTenClasses.id,
      classes_left: 5,
      valid_until: '2018-05-31',
    }).fetch();

    const signup = await ClassLivestreamSignup.create({
      'class': class1.id,
      user: fixtures.userAlice.id,
      client: testClientId,
      used_class_pass: classPass.id,
    }).fetch();

    const previousManageAllClassesValue = fixtures.userFiona.teacher_can_manage_all_classes;
    await User.update({id: fixtures.userFiona.id}, {teacher_can_manage_all_classes: true});

    MockDate.set(moment.tz('2018-05-15 23:59:59', 'Europe/Copenhagen'));

    await supertest(sails.hooks.http.app)
      .delete(
        '/class-livestream-signups/' + signup.id +
        '?client=' + testClientId,
      )
      .use(authorizeTeacherFiona())
      .expect(200);


    const updatedSignup = await ClassLivestreamSignup.findOne(signup.id);

    expect(updatedSignup).to.matchPattern(`{
      archived: false,
      cancelled_at: _.isGreaterThan|0,
      ...
    }`);

    const updatedClassPass = await ClassPass.findOne(classPass.id);

    expect(updatedClassPass.classes_left).to.equal(6);

    // Clean up
    await ClassLivestreamSignup.destroy({id: signup.id});
    await ClassPass.destroy({id: classPass.id});
    await User.update({id: fixtures.userFiona.id}, {teacher_can_manage_all_classes: previousManageAllClassesValue});

    MockDate.reset();
  });

  it('should deny access the day after for teacher, even if teacher can manage all classes', async () => {
    const classPass = await ClassPass.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      class_pass_type: fixtures.classPassTypeYogaTenClasses.id,
      classes_left: 5,
      valid_until: '2018-05-31',
    }).fetch();

    const signup = await ClassLivestreamSignup.create({
      'class': class1.id,
      user: fixtures.userAlice.id,
      client: testClientId,
      used_class_pass: classPass.id,
    }).fetch();

    const previousManageAllClassesValue = fixtures.userFiona.teacher_can_manage_all_classes;
    await User.update({id: fixtures.userFiona.id}, {teacher_can_manage_all_classes: true});

    MockDate.set(moment.tz('2018-05-16 00:00:00', 'Europe/Copenhagen'));

    await supertest(sails.hooks.http.app)
      .delete(
        '/class-livestream-signups/' + signup.id +
        '?client=' + testClientId,
      )
      .use(authorizeTeacherFiona())
      .expect('E_CLASS_HAS_STARTED');


    // Clean up
    await ClassLivestreamSignup.destroy({id: signup.id});
    await ClassPass.destroy({id: classPass.id});
    await User.update({id: fixtures.userFiona.id}, {teacher_can_manage_all_classes: previousManageAllClassesValue});

    MockDate.reset();
  });

});
