const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID;
const fixtures = require('../../../fixtures/factory').fixtures;

const supertest = require('supertest');
const {
  authorizeUserAlice,
  authorizeAdmin,
  authorizeTeacherEvelyn,
  authorizeTeacherFiona,
} = require('../../../utils/request-helpers');

const MockDate = require('mockdate');
const sinon = require('sinon');
const moment = require('moment');

describe('controller.ClassEmails.update', async () => {

  let
    emailSendFake,
    originalFunction,
    classObj,
    signups,
    waitingListSignups,
    classEmail;

  before(async () => {

    classObj = await Class.create({
      client: testClientId,
      date: '2020-05-15',
      start_time: '20:00:00',
      end_time: '21:00:00',
      class_type: fixtures.classTypeYoga.id,
      teachers: [fixtures.userEvelyn.id],
    }).fetch();

    signups = await ClassSignup.createEach([
      {
        'class': classObj.id,
        user: fixtures.userAlice.id,
        client: testClientId,
      },
    ]).fetch();

    waitingListSignups = await ClassWaitingListSignup.createEach([
      {
        'class': classObj.id,
        user: fixtures.userBill.id,
        client: testClientId,
      },
    ]).fetch();
  });


  after(async () => {
    await Class.destroy({id: classObj.id});
    await ClassSignup.destroy({id: _.map(signups, 'id')});
    await ClassWaitingListSignup.destroy({id: _.map(waitingListSignups, 'id')});

    MockDate.reset();
  });

  beforeEach(async () => {
    emailSendFake = sinon.fake();
    originalFunction = sails.helpers.email.send;
    sails.helpers.email.send = {with: emailSendFake};

    classEmail = await ClassEmail.create({
      client_id: testClientId,
      class_id: classObj.id,
      sender_id: fixtures.userAdmin.id,
      subject: 'Test subject [first_name] [last_name], [email]',
      body: 'Test body [first_name] [last_name], [email]',
      send_to_signups: true,
      send_to_waiting_list: true,
      send_to_subsequent_signups: true,
      send_at_datetime: '2020-05-15 16:00:00',
    }).fetch();
  });

  afterEach(async () => {
    sails.helpers.email.send = originalFunction;

    await ClassEmail.destroy({id: classEmail.id});
  });


  it('should throw forbidden if user is not admin or teacher', async () => {

    await supertest(sails.hooks.http.app)
      .put(`/class-emails/${classEmail.id}?client=${testClientId}`)
      .send({send_to_waiting_list: false})
      .expect(403);

    await supertest(sails.hooks.http.app)
      .put(`/class-emails/${classEmail.id}?client=${testClientId}`)
      .send({send_to_waiting_list: false})
      .use(authorizeUserAlice())
      .expect(403);

  });

  it('should update the email is user is admin', async () => {
    MockDate.set(moment.tz('2020-05-15 15:59:59', 'YYYY-MM-DD HH:mm:ss', 'Europe/Copenhagen'));

    await supertest(sails.hooks.http.app)
      .put(`/class-emails/${classEmail.id}?client=${testClientId}`)
      .send({send_to_waiting_list: false})
      .use(authorizeAdmin())
      .expect(200);

    expect(emailSendFake.callCount).equals(0);

    const updatedEmail = await ClassEmail.find({});
    expect(updatedEmail).matchPattern(
      `[{
        id: ${classEmail.id},
        email_sent: false,
        send_to_signups: true,
        send_to_waiting_list: false,
        send_to_subsequent_signups: true,
        sender_id: ${fixtures.userAdmin.id},
        ...
      }]`,
    );

    const createdInstances = await ClassEmailInstance.find({class_email_id: updatedEmail.id});
    expect(createdInstances.length).equals(0);

    await ClassEmail.destroy({});

  });

  it('should throw forbidden if teacher is not teaching the class', async () => {

    await supertest(sails.hooks.http.app)
      .put(`/class-emails/${classEmail.id}?client=${testClientId}`)
      .send({send_to_waiting_list: false})
      .use(authorizeTeacherFiona())
      .expect(403);

  });

  it('should succeed if teacher is teaching the class', async () => {

    await supertest(sails.hooks.http.app)
      .put(`/class-emails/${classEmail.id}?client=${testClientId}`)
      .send({send_to_waiting_list: false})
      .use(authorizeTeacherEvelyn())
      .expect(200);

  });

  it('should succeed if teacher can manage all classes', async () => {

    const fionaAllAccessStatus = fixtures.userFiona.teacher_can_manage_all_classes;
    await User.update({id: fixtures.userFiona.id}, {teacher_can_manage_all_classes: true});

    await supertest(sails.hooks.http.app)
      .put(`/class-emails/${classEmail.id}?client=${testClientId}`)
      .send({send_to_waiting_list: false})
      .use(authorizeTeacherFiona())
      .expect(200);

    await User.update({id: fixtures.userFiona.id}, {teacher_can_manage_all_classes: fionaAllAccessStatus});

  });

  it('should succeed if teacher is also admin', async () => {

    const fionaAdminStatus = fixtures.userFiona.admin;
    await User.update({id: fixtures.userFiona.id}, {admin: true});

    await supertest(sails.hooks.http.app)
      .put(`/class-emails/${classEmail.id}?client=${testClientId}`)
      .send({send_to_waiting_list: false})
      .use(authorizeTeacherFiona())
      .expect(200);

    await User.update({id: fixtures.userFiona.id}, {admin: fionaAdminStatus});

  });

  it('should send the email if it was previously not sent but the send time is changed to earlier', async () => {

  })

});
