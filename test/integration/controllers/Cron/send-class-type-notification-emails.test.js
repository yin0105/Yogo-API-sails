const moment = require('moment-timezone');

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID;
const fixtures = require('../../../fixtures/factory').fixtures;
const emailSendFakeFactory = require('../../../fakes/email-send-fake-factory');
const emailTransportFakeFactory = require('../../../stubs/get-email-transport-send-email-spy');

const MockDate = require('mockdate');
const sinon = require('sinon');
const supertest = require('supertest');

describe('controllers.Cron.send-class-type-notification-emails', async () => {

  let emailSendFake;

  beforeEach(async () => {
    emailSendFake = emailSendFakeFactory.installEmailSendFake();
  });

  afterEach(async () => {
    sinon.restore();
    await EmailLog.destroy({});
  });


  it('should do nothing if there are no classes that need emails sent', async () => {

    const classTypeEmail = await ClassTypeEmail.create({
      archived: false,
      client_id: testClientId,
      class_types: [fixtures.classTypeYoga.id],
      send_at: 'minutes_before_class',
      minutes_before_class: 30,
      send_to_subsequent_signups: true,
      send_to_signups: true,
      send_to_waiting_list: true,
      send_to_livestream_signups: true,
    }).fetch();

    const classStarted = await Class.create({
      client: testClientId,
      date: '2020-06-01',
      start_time: '11:59:00',
      end_time: '14:00:00',
      cancelled: false,
      archived: false,
      class_type: fixtures.classTypeYoga.id,
    }).fetch();

    const classStartsAfterTimeWindow = await Class.create({
      client: testClientId,
      date: '2020-06-01',
      start_time: '12:32:00',
      end_time: '14:00:00',
      cancelled: false,
      archived: false,
      class_type: fixtures.classTypeYoga.id,
    }).fetch();

    const classHasWrongClassType = await Class.create({
      client: testClientId,
      date: '2020-06-01',
      start_time: '12:15:00',
      end_time: '14:00:00',
      cancelled: false,
      archived: false,
      class_type: fixtures.classTypeHotYoga.id,
    }).fetch();

    const classArchived = await Class.create({
      client: testClientId,
      date: '2020-06-01',
      start_time: '12:15:00',
      end_time: '14:00:00',
      cancelled: false,
      archived: true,
      class_type: fixtures.classTypeYoga.id,
    }).fetch();

    const classCancelled = await Class.create({
      client: testClientId,
      date: '2020-06-01',
      start_time: '12:15:00',
      end_time: '14:00:00',
      cancelled: true,
      archived: false,
      class_type: fixtures.classTypeYoga.id,
    }).fetch();

    const signups = await ClassSignup.createEach([
      {
        user: fixtures.userAlice.id,
        class: classStarted.id,
      },
      {
        user: fixtures.userAlice.id,
        class: classStartsAfterTimeWindow.id,
      },
      {
        user: fixtures.userAlice.id,
        class: classHasWrongClassType.id,
      },
      {
        user: fixtures.userAlice.id,
        class: classArchived.id,
      },
      {
        user: fixtures.userAlice.id,
        class: classCancelled.id,
      },
    ]).fetch();

    MockDate.set(moment.tz('2020-06-01 12:00:00', 'Europe/Copenhagen'));

    await supertest(sails.hooks.http.app)
      .post(
        '/cron/send-class-type-notification-emails' +
        '?client=' + testClientId)
      .expect(200);

    expect(emailSendFake.callCount).to.equal(0);

    MockDate.reset();
    await ClassTypeEmail.destroy({id: classTypeEmail.id});
    await Class.destroy({
      id: [
        classStarted.id,
        classStartsAfterTimeWindow.id,
        classStartsAfterTimeWindow.id,
        classHasWrongClassType.id,
        classArchived.id,
        classCancelled.id,
      ],
    });
    await ClassSignup.destroy({id: _.map(signups, 'id')});

  });

  it('should do nothing if the class type email is archived', async () => {

    const classTypeEmail = await ClassTypeEmail.create({
      archived: true,
      client_id: testClientId,
      class_types: [fixtures.classTypeYoga.id],
      send_at: 'minutes_before_class',
      minutes_before_class: 30,
      send_to_subsequent_signups: true,
      send_to_signups: true,
      send_to_waiting_list: true,
      send_to_livestream_signups: true,
    }).fetch();

    const class1 = await Class.create({
      client: testClientId,
      date: '2020-06-01',
      start_time: '12:15:00',
      end_time: '14:00:00',
      cancelled: false,
      archived: false,
      class_type: fixtures.classTypeYoga.id,
    }).fetch();

    const signup = await ClassSignup.create(
      {
        user: fixtures.userAlice.id,
        class: class1.id,
      }).fetch();

    MockDate.set(moment.tz('2020-06-01 12:00:00', 'Europe/Copenhagen'));

    await supertest(sails.hooks.http.app)
      .post(
        '/cron/send-class-type-notification-emails' +
        '?client=' + testClientId)
      .expect(200);

    expect(emailSendFake.callCount).to.equal(0);

    MockDate.reset();
    await ClassTypeEmail.destroy({id: classTypeEmail.id});
    await Class.destroy({id: class1.id});
    await ClassSignup.destroy({id: signup.id});

  });

  it('should send email notifications to signups, waiting list signups and livestream signups, but only once to each recipient', async () => {

    sinon.restore();

    const emailTransportFake = emailTransportFakeFactory.createStub();

    const classTypeEmail = await ClassTypeEmail.create({
      archived: false,
      client_id: testClientId,
      class_types: [fixtures.classTypeYoga.id],
      send_at: 'minutes_before_class',
      minutes_before_class: 30,
      send_to_subsequent_signups: true,
      send_to_signups: true,
      send_to_waiting_list: true,
      send_to_livestream_signups: true,
      subject: 'Testing class type email subject',
      body: 'Testing class type email body',
    }).fetch();

    const class1 = await Class.create({
      client: testClientId,
      date: '2020-06-01',
      start_time: '12:15:00',
      end_time: '14:00:00',
      cancelled: false,
      archived: false,
      class_type: fixtures.classTypeYoga.id,
    }).fetch();

    const signup = await ClassSignup.create(
      {
        user: fixtures.userAlice.id,
        class: class1.id,
      }).fetch();

    MockDate.set(moment.tz('2020-06-01 12:00:00', 'Europe/Copenhagen'));

    await supertest(sails.hooks.http.app)
      .post(
        '/cron/send-class-type-notification-emails' +
        '?client=' + testClientId)
      .expect(200);

    expect(emailTransportFake.callCount).to.equal(1);

    const waitingListSignups = await ClassWaitingListSignup.createEach([
      {
        user: fixtures.userAlice.id,
        class: class1.id,
      },
      {
        user: fixtures.userBill.id,
        class: class1.id,
      },
    ]).fetch();

    await supertest(sails.hooks.http.app)
      .post(
        '/cron/send-class-type-notification-emails' +
        '?client=' + testClientId)
      .expect(200);

    expect(emailTransportFake.callCount).to.equal(2);

    const livestreamSignups = await ClassLivestreamSignup.createEach([
      {
        user: fixtures.userAlice.id,
        class: class1.id,
      },
      {
        user: fixtures.userCharlie.id,
        class: class1.id,
      },
    ]).fetch();

    await supertest(sails.hooks.http.app)
      .post(
        '/cron/send-class-type-notification-emails' +
        '?client=' + testClientId)
      .expect(200);

    expect(emailTransportFake.callCount).to.equal(3);


    MockDate.reset();
    await ClassTypeEmail.destroy({id: classTypeEmail.id});
    await Class.destroy({id: class1.id});
    await ClassSignup.destroy({id: signup.id});
    await ClassWaitingListSignup.destroy({id: _.map(waitingListSignups, 'id')});
    await ClassLivestreamSignup.destroy({id: _.map(livestreamSignups, 'id')});

  });

  it('should not send to signups created after deadline if "send_to_subsequent_signups" is FALSE', async () => {

    const classTypeEmail = await ClassTypeEmail.create({
      archived: false,
      client_id: testClientId,
      class_types: [fixtures.classTypeYoga.id],
      send_at: 'minutes_before_class',
      minutes_before_class: 30,
      send_to_subsequent_signups: false,
      send_to_signups: true,
      send_to_waiting_list: true,
      send_to_livestream_signups: true,
      subject: 'Testing class type email subject',
      body: 'Testing class type email body',
    }).fetch();

    const class1 = await Class.create({
      client: testClientId,
      date: '2020-06-01',
      start_time: '12:15:00',
      end_time: '14:00:00',
      cancelled: false,
      archived: false,
      class_type: fixtures.classTypeYoga.id,
    }).fetch();

    const signups = await ClassSignup.createEach([
      {
        user: fixtures.userAlice.id,
        class: class1.id,
        createdAt: moment.tz('2020-06-01 11:44:00', 'Europe/Copenhagen').format('x'),
      },
      {
        user: fixtures.userBill.id,
        class: class1.id,
        createdAt: moment.tz('2020-06-01 11:46:00', 'Europe/Copenhagen').format('x'),
      },
    ]).fetch();

    MockDate.set(moment.tz('2020-06-01 12:00:00', 'Europe/Copenhagen'));

    await supertest(sails.hooks.http.app)
      .post(
        '/cron/send-class-type-notification-emails' +
        '?client=' + testClientId)
      .expect(200);

    expect(emailSendFake.callCount).to.equal(1);

    expect(emailSendFake.getCall(0).args[0]).to.matchPattern(`{
      user: ${fixtures.userAlice.id},
      subject: 'Testing class type email subject',
      text: 'Testing class type email body',
      emailType: 'class_type_email',
      classId: ${class1.id},
      classTypeEmailId: ${classTypeEmail.id}
    }`);

    await ClassTypeEmail.destroy({id: classTypeEmail.id});
    await Class.destroy({id: class1.id});
    await ClassSignup.destroy({id: _.map(signups, 'id')});


  });

  it('should not send to archived signups', async () => {

    const classTypeEmail = await ClassTypeEmail.create({
      archived: false,
      client_id: testClientId,
      class_types: [fixtures.classTypeYoga.id],
      send_at: 'minutes_before_class',
      minutes_before_class: 30,
      send_to_subsequent_signups: true,
      send_to_signups: true,
      send_to_waiting_list: true,
      send_to_livestream_signups: true,
      subject: 'Testing class type email subject',
      body: 'Testing class type email body',
    }).fetch();

    const class1 = await Class.create({
      client: testClientId,
      date: '2020-06-01',
      start_time: '12:15:00',
      end_time: '14:00:00',
      cancelled: false,
      archived: false,
      class_type: fixtures.classTypeYoga.id,
    }).fetch();

    const signups = await ClassSignup.createEach([
      {
        user: fixtures.userAlice.id,
        class: class1.id,
        archived: true,
      },
      {
        user: fixtures.userBill.id,
        class: class1.id,
      },
    ]).fetch();

    MockDate.set(moment.tz('2020-06-01 12:00:00', 'Europe/Copenhagen'));

    await supertest(sails.hooks.http.app)
      .post(
        '/cron/send-class-type-notification-emails' +
        '?client=' + testClientId)
      .expect(200);

    expect(emailSendFake.callCount).to.equal(1);

    expect(emailSendFake.getCall(0).args[0]).to.matchPattern(`{
      user: ${fixtures.userBill.id},
      subject: 'Testing class type email subject',
      text: 'Testing class type email body',
      emailType: 'class_type_email',
      classId: ${class1.id},
      classTypeEmailId: ${classTypeEmail.id}
    }`);

    await ClassTypeEmail.destroy({id: classTypeEmail.id});
    await Class.destroy({id: class1.id});
    await ClassSignup.destroy({id: _.map(signups, 'id')});

  })

});
