const supertest = require('supertest');

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID;
const fixtures = require('../../../fixtures/factory').fixtures;

const MockDate = require('mockdate');
const moment = require('moment-timezone');

const {authorizeAdmin, authorizeUserAlice, authorizeUserBill, authorizeUserCharlie, authorizeUserDennis, authorizeTeacherEvelyn} = require('../../../utils/request-helpers');


describe('controllers.ClassWaitingListSignups.create', () => {

  let
    classTemplate,
    membershipUserA,
    membershipUserB,
    membershipUserC;

  before(async () => {
    classTemplate = {
      date: '2018-05-15',
      start_time: '10:00:00',
      end_time: '12:00:00',
      client: testClientId,
      class_type: fixtures.classTypeYoga.id,
      seats: 2,
      livestream_enabled: true,
    };

    await Membership.destroy({});
    await ClassPass.destroy({});

    membershipUserA = await Membership.create({
      user: fixtures.userAlice.id,
      membership_type: fixtures.membershipTypeYogaUnlimitedLivestream.id,
      paid_until: '2018-05-31',
      status: 'active',
      client: testClientId,
    }).fetch();

    membershipUserB = await Membership.create({
      user: fixtures.userBill.id,
      membership_type: fixtures.membershipTypeYogaUnlimitedLivestream.id,
      paid_until: '2018-05-31',
      status: 'active',
      client: testClientId,
    }).fetch();

    membershipUserC = await Membership.create({
      user: fixtures.userCharlie.id,
      membership_type: fixtures.membershipTypeYogaUnlimitedLivestream.id,
      paid_until: '2018-05-31',
      status: 'active',
      client: testClientId,
    }).fetch();

  });

  after(async () => {

    await Membership.destroy({
      id: [membershipUserA.id, membershipUserB.id, membershipUserC.id],
    });

  });

  afterEach(async () => {
    MockDate.reset();
  });


  it('should create a livestream signup record in the database and return it', async () => {

    const classItem = await Class.create(classTemplate).fetch(); // 2018-05-15 10:00:00

    MockDate.set(moment.tz('2018-05-14 10:00:00', 'Europe/Copenhagen'));

    const response = await supertest(sails.hooks.http.app)
      .post(
        '/class-livestream-signups' +
        '?client=' + testClientId,
      )
      .send({
        'class': classItem.id,
        user: fixtures.userCharlie.id,
      })
      .use(authorizeUserCharlie())
      .expect(200);

    expect(response.body).to.matchPattern(
      `{
        'class': ${classItem.id},
        user: ${fixtures.userCharlie.id},
        used_membership: ${membershipUserC.id},
        ...
      }`,
    );

    const responseSignupId = response.body.id;

    const createdSignup = await ClassLivestreamSignup.findOne(responseSignupId);

    expect(createdSignup).to.matchPattern(
      `{
        id: ${responseSignupId},
        'class': ${classItem.id},
        user: ${fixtures.userCharlie.id},
        used_membership: ${membershipUserC.id},        
        ...
      }`,
    );

    // Clean up
    await ClassLivestreamSignup.destroy({id: responseSignupId});

  });


  it('should return 403 forbidden if user is not allowed to sign up', async () => {

    const classItem = await Class.create(classTemplate).fetch(); // 2018-05-15 10:00:00

    MockDate.set(moment.tz('2018-05-15 07:00:00', 'Europe/Copenhagen'));

    await supertest(sails.hooks.http.app)
      .post(
        '/class-livestream-signups' +
        '?client=' + testClientId,
      )
      .send({
        'class': classItem.id,
        user: fixtures.userCharlie.id, // Bill can not sign Charlie up.
      })
      .use(authorizeUserBill())
      .expect(403);

    await Class.destroy({id: classItem.id});

  });

  it('should return "E_CLASS_HAS_STARTED" if class has started and user is customer', async () => {

    const classItem = await Class.create(classTemplate).fetch(); // 2018-05-15 10:00:00

    MockDate.set(moment.tz('2018-05-15 10:01:00', 'Europe/Copenhagen'));

    await supertest(sails.hooks.http.app)
      .post(
        '/class-livestream-signups' +
        '?client=' + testClientId,
      )
      .send({
        'class': classItem.id,
        user: fixtures.userCharlie.id,
      })
      .use(authorizeUserCharlie())
      .expect(200)
      .expect('E_CLASS_HAS_STARTED');

    await Class.destroy({id: classItem.id});

  });

  it('should allow signup from admin for the rest of the day', async () => {

    const classItem = await Class.create(classTemplate).fetch(); // 2018-05-15 10:00:00

    MockDate.set(moment.tz('2018-05-15 23:59:59', 'Europe/Copenhagen'));

    const {body: createdSignup} = await supertest(sails.hooks.http.app)
      .post(
        '/class-livestream-signups' +
        '?client=' + testClientId,
      )
      .send({
        'class': classItem.id,
        user: fixtures.userCharlie.id,
      })
      .use(authorizeAdmin())
      .expect(200);

    await ClassLivestreamSignup.destroy({id: createdSignup.id});

    await Class.destroy({id: classItem.id});

  });

  it('should disallow signup from admin when the day has passed', async () => {

    const classItem = await Class.create(classTemplate).fetch(); // 2018-05-15 10:00:00

    MockDate.set(moment.tz('2018-05-16 00:00:00', 'Europe/Copenhagen'));

    await supertest(sails.hooks.http.app)
      .post(
        '/class-livestream-signups' +
        '?client=' + testClientId,
      )
      .send({
        'class': classItem.id,
        user: fixtures.userCharlie.id,
      })
      .use(authorizeAdmin())
      .expect(200)
      .expect('E_CLASS_HAS_STARTED');

    await Class.destroy({id: classItem.id});

  });

  it('should allow signup from teacher for the rest of the day, if the teacher is teaching the class', async () => {

    const classItem = await Class.create({
      ...classTemplate,
      teachers: [fixtures.userEvelyn.id]
    }).fetch(); // 2018-05-15 10:00:00

    MockDate.set(moment.tz('2018-05-15 23:59:59', 'Europe/Copenhagen'));

    const {body: createdSignup} = await supertest(sails.hooks.http.app)
      .post(
        '/class-livestream-signups' +
        '?client=' + testClientId,
      )
      .send({
        'class': classItem.id,
        user: fixtures.userCharlie.id,
      })
      .use(authorizeTeacherEvelyn())
      .expect(200);

    expect(createdSignup).to.matchPattern(`{
      class: ${classItem.id},
      user: ${fixtures.userCharlie.id},
      ...
    }`);

    await ClassLivestreamSignup.destroy({id: createdSignup.id});

    await Class.destroy({id: classItem.id});

  });

  it('should disallow signup from teacher, when the day has passed', async () => {

    const classItem = await Class.create({
      ...classTemplate,
      teachers: [fixtures.userEvelyn.id]
    }).fetch(); // 2018-05-15 10:00:00

    MockDate.set(moment.tz('2018-05-16 00:00:00', 'Europe/Copenhagen'));

    await supertest(sails.hooks.http.app)
      .post(
        '/class-livestream-signups' +
        '?client=' + testClientId,
      )
      .send({
        'class': classItem.id,
        user: fixtures.userCharlie.id,
      })
      .use(authorizeTeacherEvelyn())
      .expect(200)
      .expect('E_CLASS_HAS_STARTED');

    await Class.destroy({id: classItem.id});

  });

  it('should disallow signup from teacher, if the teacher is not teaching the class', async () => {

    const classItem = await Class.create(classTemplate).fetch(); // 2018-05-15 10:00:00

    MockDate.set(moment.tz('2018-05-16 00:00:00', 'Europe/Copenhagen'));

    await supertest(sails.hooks.http.app)
      .post(
        '/class-livestream-signups' +
        '?client=' + testClientId,
      )
      .send({
        'class': classItem.id,
        user: fixtures.userCharlie.id,
      })
      .use(authorizeTeacherEvelyn())
      .expect(403)

    await Class.destroy({id: classItem.id});

  });

  it('should allow signup from teacher, if the teacher is not teaching the class, but the teacher has access to all classes', async () => {

    const classItem = await Class.create(classTemplate).fetch(); // 2018-05-15 10:00:00

    const {teacher_can_manage_all_classes: previousTeacherAccessSetting} = await User.findOne(fixtures.userEvelyn.id);
    await User.update({id: fixtures.userEvelyn.id}, {teacher_can_manage_all_classes: true});

    MockDate.set(moment.tz('2018-05-15 23:59:59', 'Europe/Copenhagen'));

    const {body: createdSignup} = await supertest(sails.hooks.http.app)
      .post(
        '/class-livestream-signups' +
        '?client=' + testClientId,
      )
      .send({
        'class': classItem.id,
        user: fixtures.userCharlie.id,
      })
      .use(authorizeTeacherEvelyn())
      .expect(200);

    expect(createdSignup).to.matchPattern(`{
      class: ${classItem.id},
      user: ${fixtures.userCharlie.id},
      ...
    }`);

    await ClassLivestreamSignup.destroy({id: createdSignup.id});
    await Class.destroy({id: classItem.id});
    await User.update({id: fixtures.userEvelyn.id}, {teacher_can_manage_all_classes: previousTeacherAccessSetting});

  });

  it('should disallow signup from teacher, if the teacher has access to all classes, but the day has passed', async () => {

    const classItem = await Class.create(classTemplate).fetch(); // 2018-05-15 10:00:00

    const {teacher_can_manage_all_classes: previousTeacherAccessSetting} = await User.findOne(fixtures.userEvelyn.id);
    await User.update({id: fixtures.userEvelyn.id}, {teacher_can_manage_all_classes: true});

    MockDate.set(moment.tz('2018-05-16 00:00:00', 'Europe/Copenhagen'));

    await supertest(sails.hooks.http.app)
      .post(
        '/class-livestream-signups' +
        '?client=' + testClientId,
      )
      .send({
        'class': classItem.id,
        user: fixtures.userCharlie.id,
      })
      .use(authorizeTeacherEvelyn())
      .expect(200)
      .expect('E_CLASS_HAS_STARTED');

    await Class.destroy({id: classItem.id});
    await User.update({id: fixtures.userEvelyn.id}, {teacher_can_manage_all_classes: previousTeacherAccessSetting});

  });

  it('should return "E_ALREADY_SIGNED_UP" if customer is signed up', async () => {

    const classItem = await Class.create(classTemplate).fetch(); // 2018-05-15 10:00:00

    const signup = await ClassLivestreamSignup.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      class: classItem.id,
    }).fetch();

    MockDate.set(moment.tz('2018-05-15 07:00:00', 'Europe/Copenhagen'));

    await supertest(sails.hooks.http.app)
      .post(
        '/class-livestream-signups' +
        '?client=' + testClientId,
      )
      .send({
        'class': classItem.id,
        user: fixtures.userAlice.id,
      })
      .use(authorizeUserAlice())
      .expect(200)
      .expect('E_ALREADY_SIGNED_UP');

    await ClassLivestreamSignup.destroy({id: signup.id});
    await Class.destroy({id: classItem.id});

  });

  it('should return "E_CLASS_CANCELLED" if class is cancelled', async () => {

    const classItem = await Class.create({...classTemplate, cancelled: true}).fetch(); // 2018-05-15 10:00:00

    MockDate.set(moment.tz('2018-05-15 07:00:00', 'Europe/Copenhagen'));

    await supertest(sails.hooks.http.app)
      .post(
        '/class-livestream-signups' +
        '?client=' + testClientId,
      )
      .send({
        'class': classItem.id,
        user: fixtures.userAlice.id,
      })
      .use(authorizeUserAlice())
      .expect(200)
      .expect('E_CLASS_CANCELLED');

    await Class.destroy({id: classItem.id});

  });

  it('should return "E_CLASS_IS_FULL" if class is fully booked (Liveswitch plan limit)', async () => {

    const classItem = await Class.create(classTemplate).fetch(); // 2018-05-15 10:00:00

    const previousLimit = sails.config.fmLiveswitch.maxConnectionsPerSession;
    sails.config.fmLiveswitch.maxConnectionsPerSession = 1;

    const signup = await ClassLivestreamSignup.create({
      client: testClientId,
      class: classItem.id,
      user: fixtures.userAlice.id,
    }).fetch();

    MockDate.set(moment.tz('2018-05-15 07:00:00', 'Europe/Copenhagen'));

    await supertest(sails.hooks.http.app)
      .post(
        '/class-livestream-signups' +
        '?client=' + testClientId,
      )
      .send({
        'class': classItem.id,
        user: fixtures.userBill.id,
      })
      .use(authorizeUserBill())
      .expect(200)
      .expect('E_CLASS_IS_FULL');

    sails.config.fmLiveswitch.maxConnectionsPerSession = previousLimit;
    await ClassLivestreamSignup.destroy({id: signup.id});
    await Class.destroy({id: classItem.id});

  });


  it('should return "E_CUSTOMER_HAS_NO_VALID_CLASS_PASS_OR_MEMBERSHIP" if customer does not have that', async () => {

    const classItem = await Class.create(classTemplate).fetch(); // 2018-05-15 10:00:00

    MockDate.set(moment.tz('2018-05-15 07:00:00', 'Europe/Copenhagen'));

    await supertest(sails.hooks.http.app)
      .post(
        '/class-livestream-signups' +
        '?client=' + testClientId,
      )
      .send({
        'class': classItem.id,
        user: fixtures.userDennis.id,
      })
      .use(authorizeUserDennis())
      .expect(200)
      .expect('E_CUSTOMER_HAS_NO_VALID_CLASS_PASS_OR_MEMBERSHIP');

    await Class.destroy({id: classItem.id});

  });

  it('should deny access to admin if user is on another client', async () => {

    const classItem = await Class.create(classTemplate).fetch(); // 2018-05-15 10:00:00
    const userOnAnotherClient = await User.create({
      client: testClientId + 1,
      email: 'test@yogo.dk',
    }).fetch();

    MockDate.set(moment.tz('2018-05-15 07:00:00', 'Europe/Copenhagen'));

    await supertest(sails.hooks.http.app)
      .post(
        '/class-livestream-signups' +
        '?client=' + testClientId,
      )
      .send({
        'class': classItem.id,
        user: userOnAnotherClient.id,
      })
      .use(authorizeAdmin())
      .expect(403);

    await Class.destroy({id: classItem.id});
    await User.destroy({id: userOnAnotherClient.id});

  });

  it('should deny access to teacher if user is on another client', async () => {

    const classItem = await Class.create(classTemplate).fetch(); // 2018-05-15 10:00:00
    const userOnAnotherClient = await User.create({
      client: testClientId + 1,
      email: 'test@yogo.dk',
    }).fetch();

    const {teacher_can_manage_all_classes: previousTeacherAccessSetting} = await User.findOne(fixtures.userEvelyn.id);
    await User.update({id: fixtures.userEvelyn.id}, {teacher_can_manage_all_classes: true});

    MockDate.set(moment.tz('2018-05-15 07:00:00', 'Europe/Copenhagen'));

    await supertest(sails.hooks.http.app)
      .post(
        '/class-livestream-signups' +
        '?client=' + testClientId,
      )
      .send({
        'class': classItem.id,
        user: userOnAnotherClient.id,
      })
      .use(authorizeTeacherEvelyn())
      .expect(403);

    await Class.destroy({id: classItem.id});
    await User.destroy({id: userOnAnotherClient.id});
    await User.update({id: fixtures.userEvelyn.id}, {teacher_can_manage_all_classes: previousTeacherAccessSetting});

  });


});
