const supertest = require('supertest');

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID;
const fixtures = require('../../../fixtures/factory').fixtures;

const MockDate = require('mockdate');
const moment = require('moment-timezone');

const {authorizeUserAlice, authorizeUserBill, authorizeUserCharlie, authorizeUserDennis} = require('../../../utils/request-helpers');


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
    };

    await Membership.destroy({});
    await ClassPass.destroy({});

    membershipUserA = await Membership.create({
      user: fixtures.userAlice.id,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      paid_until: '2018-05-31',
      status: 'active',
      client: testClientId,
    }).fetch();

    membershipUserB = await Membership.create({
      user: fixtures.userBill.id,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      paid_until: '2018-05-31',
      status: 'active',
      client: testClientId,
    }).fetch();

    membershipUserC = await Membership.create({
      user: fixtures.userCharlie.id,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
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


  it('should create a waiting list signup record in the database and return it', async () => {

    const classItem = await Class.create(classTemplate).fetch(); // 2018-05-15 10:00:00
    const signups = await ClassSignup.createEach([
      {
        'class': classItem.id,
        user: fixtures.userAlice.id,
        used_membership: membershipUserA.id,
      },
      {
        'class': classItem.id,
        user: fixtures.userBill.id,
        used_membership: membershipUserB.id,
      },
    ]);

    MockDate.set(moment.tz('2018-05-14 10:00:00', 'Europe/Copenhagen'));

    const response = await supertest(sails.hooks.http.app)
      .post(
        '/class-waiting-list-signups' +
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

    const createdSignup = await ClassWaitingListSignup.findOne(responseSignupId);

    expect(createdSignup).to.matchPattern(
      `{
        id: ${responseSignupId},
        'class': ${classItem.id},
        user: ${fixtures.userCharlie.id},
        used_membership: ${membershipUserC.id},
        class_pass_seat_spent: false,
        ...
      }`,
    );

    // Clean up
    await ClassWaitingListSignup.destroy({id: responseSignupId});
    await ClassSignup.destroy({id: _.map(signups, 'id')});

  });

  it('should return 403 forbidden if user is not allowed to sign up', async () => {

    const classItem = await Class.create(classTemplate).fetch(); // 2018-05-15 10:00:00

    MockDate.set(moment.tz('2018-05-15 07:00:00', 'Europe/Copenhagen'));

    await supertest(sails.hooks.http.app)
      .post(
        '/class-waiting-list-signups' +
        '?client=' + testClientId,
      )
      .send({
        'class': classItem.id,
        user: fixtures.userCharlie.id,
      })
      .use(authorizeUserBill())
      .expect(403);

    await Class.destroy({id: classItem.id});

  });

  it('should return "E_CLASS_WAITING_LIST_DISABLED" if class waiting lists are disabled', async () => {

    const clientSettingRow = await ClientSettings.create({
      client: testClientId,
      key: 'class_waiting_list_enabled',
      value: false,
    }).fetch();

    const classItem = await Class.create(classTemplate).fetch(); // 2018-05-15 10:00:00

    MockDate.set(moment.tz('2018-05-15 07:00:00', 'Europe/Copenhagen'));

    await supertest(sails.hooks.http.app)
      .post(
        '/class-waiting-list-signups' +
        '?client=' + testClientId,
      )
      .send({
        'class': classItem.id,
        user: fixtures.userCharlie.id,
      })
      .use(authorizeUserCharlie())
      .expect(200)
      .expect('"E_CLASS_WAITING_LIST_DISABLED"');

    await ClientSettings.destroy({id: clientSettingRow.id});
    await Class.destroy({id: classItem.id});

  });

  it('should return "E_PRIVATE_CLASS_WAITING_LIST_DISABLED" if private class waiting lists are disabled', async () => {

    const clientSettingRow = await ClientSettings.create({
      client: testClientId,
      key: 'private_class_waiting_list_enabled',
      value: false,
    }).fetch();

    const privateClassTemplate = _.chain(classTemplate).cloneDeep().assign({seats: 1}).value();

    const classItem = await Class.create(privateClassTemplate).fetch(); // 2018-05-15 10:00:00

    MockDate.set(moment.tz('2018-05-14 07:00:00', 'Europe/Copenhagen'));

    await supertest(sails.hooks.http.app)
      .post(
        '/class-waiting-list-signups' +
        '?client=' + testClientId,
      )
      .send({
        'class': classItem.id,
        user: fixtures.userCharlie.id,
      })
      .use(authorizeUserCharlie())
      .expect(200)
      .expect('"E_PRIVATE_CLASS_WAITING_LIST_DISABLED"');

    await ClientSettings.destroy({id: clientSettingRow.id});
    await Class.destroy({id: classItem.id});

  });

  it('should return "E_CLASS_IS_OPEN" if class is open', async () => {

    const openClassTemplate = _.chain(classTemplate).cloneDeep().assign({seats: 0}).value();

    const classItem = await Class.create(openClassTemplate).fetch(); // 2018-05-15 10:00:00

    MockDate.set(moment.tz('2018-05-15 07:00:00', 'Europe/Copenhagen'));

    await supertest(sails.hooks.http.app)
      .post(
        '/class-waiting-list-signups' +
        '?client=' + testClientId,
      )
      .send({
        'class': classItem.id,
        user: fixtures.userCharlie.id,
      })
      .use(authorizeUserCharlie())
      .expect(200)
      .expect('"E_CLASS_IS_OPEN"');

    await Class.destroy({id: classItem.id});

  });

  it('should return "E_CLASS_HAS_STARTED" if class has started', async () => {

    const classItem = await Class.create(classTemplate).fetch(); // 2018-05-15 10:00:00

    MockDate.set(moment.tz('2018-05-16 10:00:00', 'Europe/Copenhagen'));

    await supertest(sails.hooks.http.app)
      .post(
        '/class-waiting-list-signups' +
        '?client=' + testClientId,
      )
      .send({
        'class': classItem.id,
        user: fixtures.userCharlie.id,
      })
      .use(authorizeUserCharlie())
      .expect(200)
      .expect('"E_CLASS_HAS_STARTED"');

  });

  it('should return "E_SIGNUP_DEADLINE_HAS_BEEN_EXCEEDED" if signup deadline has been exceeded', async () => {

    const privateClassTemplate = _.chain(classTemplate).cloneDeep().assign({seats: 1}).value();

    const classItem = await Class.create(privateClassTemplate).fetch(); // 2018-05-15 10:00:00

    MockDate.set(moment.tz('2018-05-15 08:00:00', 'Europe/Copenhagen'));

    await supertest(sails.hooks.http.app)
      .post(
        '/class-waiting-list-signups' +
        '?client=' + testClientId,
      )
      .send({
        'class': classItem.id,
        user: fixtures.userCharlie.id,
      })
      .use(authorizeUserCharlie())
      .expect(200)
      .expect('"E_SIGNUP_DEADLINE_HAS_BEEN_EXCEEDED"');

  });

  it('should return "E_SIGNOFF_DEADLINE_HAS_BEEN_EXCEEDED" if signoff deadline has been exceeded', async () => {

    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'no_show_fees_enabled',
      value: 1,
    }).fetch();

    const classItem = await Class.create(classTemplate).fetch(); // 2018-05-15 10:00:00

    MockDate.set(moment.tz('2018-05-15 09:00:00', 'Europe/Copenhagen'));

    await supertest(sails.hooks.http.app)
      .post(
        '/class-waiting-list-signups' +
        '?client=' + testClientId,
      )
      .send({
        'class': classItem.id,
        user: fixtures.userCharlie.id,
      })
      .use(authorizeUserCharlie())
      .expect(200)
      .expect('"E_SIGNOFF_DEADLINE_HAS_BEEN_EXCEEDED"');

    await ClientSettings.destroy({id: clientSettingsRow.id});

  });

  it('should return "E_ALREADY_SIGNED_UP" if user is already signed up', async () => {

    const classItem = await Class.create(classTemplate).fetch(); // 2018-05-15 10:00:00

    const signup = await ClassSignup.create({
      'class': classItem.id,
      user: fixtures.userAlice.id,
      used_membership: membershipUserA.id,
    }).fetch();

    MockDate.set(moment.tz('2018-05-15 07:00:00', 'Europe/Copenhagen'));

    await supertest(sails.hooks.http.app)
      .post(
        '/class-waiting-list-signups' +
        '?client=' + testClientId,
      )
      .send({
        'class': classItem.id,
        user: fixtures.userAlice.id,
      })
      .use(authorizeUserAlice())
      .expect(200)
      .expect('"E_ALREADY_SIGNED_UP"');

    await ClassSignup.destroy({id: signup.id});
    await Class.destroy({id: classItem.id});

  });

  it('should return "E_ALREADY_SIGNED_UP_FOR_WAITING_LIST" if user is already signed up for waiting list', async () => {

    const classItem = await Class.create(classTemplate).fetch(); // 2018-05-15 10:00:00

    const signups = await ClassSignup.createEach(
      [
        {
          'class': classItem.id,
          user: fixtures.userAlice.id,
          used_membership: membershipUserA.id,
        },
        {
          'class': classItem.id,
          user: fixtures.userBill.id,
          used_membership: membershipUserB.id,
        },
      ],
    ).fetch();

    const waitingListSignup = await ClassWaitingListSignup.create({
      'class': classItem.id,
      user: fixtures.userCharlie.id,
      used_membership: membershipUserC.id,
    }).fetch();

    MockDate.set(moment.tz('2018-05-15 07:00:00', 'Europe/Copenhagen'));

    await supertest(sails.hooks.http.app)
      .post(
        '/class-waiting-list-signups' +
        '?client=' + testClientId,
      )
      .send({
        'class': classItem.id,
        user: fixtures.userCharlie.id,
      })
      .use(authorizeUserCharlie())
      .expect(200)
      .expect('"E_ALREADY_SIGNED_UP_FOR_WAITING_LIST"');

    await ClassSignup.destroy({id: _.map(signups, 'id')});
    await ClassWaitingListSignup.destroy({id: waitingListSignup.id});
    await Class.destroy({id: classItem.id});

  });

  it('should return "E_CLASS_CANCELLED" if class is cancelled', async () => {

    const cancelledClassTemplate = _.chain(classTemplate).cloneDeep().assign({cancelled: true}).value();

    const classItem = await Class.create(cancelledClassTemplate).fetch(); // 2018-05-15 10:00:00

    MockDate.set(moment.tz('2018-05-15 07:00:00', 'Europe/Copenhagen'));

    await supertest(sails.hooks.http.app)
      .post(
        '/class-waiting-list-signups' +
        '?client=' + testClientId,
      )
      .send({
        'class': classItem.id,
        user: fixtures.userCharlie.id,
      })
      .use(authorizeUserCharlie())
      .expect(200)
      .expect('"E_CLASS_CANCELLED"');

    await ClassSignup.destroy({id: classItem.id});


  });

  it('should return "E_WAITING_LIST_IS_FULL" if waiting list is full', async () => {

    const classItem = await Class.create(classTemplate).fetch(); // 2018-05-15 10:00:00

    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'class_waiting_list_max_customers_on_waiting_list',
      value: 1,
    }).fetch();

    MockDate.set(moment.tz('2018-05-15 07:00:00', 'Europe/Copenhagen'));

    const signups = await ClassSignup.createEach([
        {
          'class': classItem.id,
          user: fixtures.userAlice.id,
          used_membership: membershipUserA.id,
        },
        {
          'class': classItem.id,
          user: fixtures.userBill.id,
          used_membership: membershipUserB.id,
        },
      ],
    ).fetch();

    const waitingListSignup = await ClassWaitingListSignup.create({
      'class': classItem.id,
      user: fixtures.userCharlie.id,
      used_membership: membershipUserC.id,
    }).fetch();

    await supertest(sails.hooks.http.app)
      .post(
        '/class-waiting-list-signups' +
        '?client=' + testClientId,
      )
      .send({
        'class': classItem.id,
        user: fixtures.userDennis.id,
      })
      .use(authorizeUserDennis())
      .expect(200)
      .expect('"E_WAITING_LIST_IS_FULL"');

    await ClassSignup.destroy({id: _.map(signups, 'id')});
    await ClassWaitingListSignup.destroy({id: waitingListSignup.id});
    await Class.destroy({id: classItem.id});
    await ClientSettings.destroy({id: clientSettingsRow.id});


  });

  it('should return "E_CLASS_IS_NOT_FULL" if waiting list is full', async () => {

    const classItem = await Class.create(classTemplate).fetch(); // 2018-05-15 10:00:00

    MockDate.set(moment.tz('2018-05-15 07:00:00', 'Europe/Copenhagen'));

    const signups = await ClassSignup.createEach([
        {
          'class': classItem.id,
          user: fixtures.userAlice.id,
          used_membership: membershipUserA.id,
        },
      ],
    ).fetch();


    await supertest(sails.hooks.http.app)
      .post(
        '/class-waiting-list-signups' +
        '?client=' + testClientId,
      )
      .send({
        'class': classItem.id,
        user: fixtures.userDennis.id,
      })
      .use(authorizeUserDennis())
      .expect(200)
      .expect('"E_CLASS_IS_NOT_FULL"');

    await ClassSignup.destroy({id: _.map(signups, 'id')});
    await Class.destroy({id: classItem.id});

  });

  it('should return "E_CUSTOMER_HAS_NO_VALID_CLASS_PASS_OR_MEMBERSHIP" if customer does not have that', async () => {

    const classItem = await Class.create(classTemplate).fetch(); // 2018-05-15 10:00:00

    MockDate.set(moment.tz('2018-05-15 07:00:00', 'Europe/Copenhagen'));

    const signups = await ClassSignup.createEach([
        {
          'class': classItem.id,
          user: fixtures.userAlice.id,
          used_membership: membershipUserA.id,
        },
        {
          'class': classItem.id,
          user: fixtures.userBill.id,
          used_membership: membershipUserB.id,
        },
      ],
    ).fetch();


    await supertest(sails.hooks.http.app)
      .post(
        '/class-waiting-list-signups' +
        '?client=' + testClientId,
      )
      .send({
        'class': classItem.id,
        user: fixtures.userDennis.id,
      })
      .use(authorizeUserDennis())
      .expect(200)
      .expect('"E_CUSTOMER_HAS_NO_VALID_CLASS_PASS_OR_MEMBERSHIP"');

    await ClassSignup.destroy({id: _.map(signups, 'id')});
    await Class.destroy({id: classItem.id});

  });


});
