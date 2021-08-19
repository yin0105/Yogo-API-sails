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

describe('controller.ClassEmails.create', async () => {

  let emailSendFake;

  let originalFunction;

  beforeEach(async () => {
    emailSendFake = sinon.fake();
    originalFunction = sails.helpers.email.send;
    sails.helpers.email.send = {with: emailSendFake};
  });

  afterEach(() => {
    sails.helpers.email.send = originalFunction;
  });

  let classObj,
    signups,
    waitingListSignups,
    emailTemplate;

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

    emailTemplate = {
      class_id: classObj.id,
      subject: 'Test subject [first_name] [last_name], [email]',
      body: 'Test body [first_name] [last_name], [email]',
      send_to_signups: true,
      send_to_waiting_list: true,
      send_to_subsequent_signups: true,
      send_at_datetime: '2020-05-15 16:00:00',
    };
  });

  after(async () => {
    await Class.destroy({id: classObj.id});
    await ClassSignup.destroy({id: _.map(signups, 'id')});
    await ClassWaitingListSignup.destroy({id: _.map(waitingListSignups, 'id')});

    MockDate.reset();
  });

  describe('no relevant user', async () => {

    it('should throw forbidden if user is not admin or teacher', async () => {

      await supertest(sails.hooks.http.app)
        .post('/class-emails?client=' + testClientId)
        .send(emailTemplate)
        .expect(403);

      await supertest(sails.hooks.http.app)
        .post('/class-emails?client=' + testClientId)
        .send(emailTemplate)
        .use(authorizeUserAlice())
        .expect(403);

    });

  });

  describe('admin', async () => {

    it('should fail if class does not exist or is archived', async () => {
      await ClassEmail.destroy({});
      
      await supertest(sails.hooks.http.app)
        .post('/class-emails?client=' + testClientId)
        .send(_.assign(_.cloneDeep(emailTemplate), {class_id: 99999999}))
        .use(authorizeAdmin())
        .expect(400)
        .expect('"E_CLASS_NOT_FOUND"');

    });

    it('should create the email and send it right away, if send time has passed', async () => {
      MockDate.set(moment.tz('2020-05-15 16:00:00', 'YYYY-MM-DD HH:mm:ss', 'Europe/Copenhagen'));

      await supertest(sails.hooks.http.app)
        .post('/class-emails?client=' + testClientId)
        .send(emailTemplate)
        .use(authorizeAdmin())
        .expect(200);

      expect(emailSendFake.callCount).equals(2);

      expect(emailSendFake.firstCall.args[0]).to.matchPattern(
        `{
        user: {id: ${fixtures.userAlice.id}, ...},
        subject: 'Test subject Alice Ali, userAlice@yogo.dk',
        text: 'Test body Alice Ali, userAlice@yogo.dk',
        ...
      }`,
      );

      const createdEmails = await ClassEmail.find({});
      expect(createdEmails.length).equals(1);
      expect(createdEmails[0]).matchPattern(
        `{
        email_sent: true,
        send_to_signups: true,
        send_to_waiting_list: true,
        send_to_livestream_signups: false,
        send_to_subsequent_signups: true,
        sender_id: ${fixtures.userAdmin.id},
        auto_send_status: 'active',
        ...             
      }`,
      );

      const createdInstances = await ClassEmailInstance.find({class_email_id: createdEmails[0].id}).sort('recipient_id ASC');

      expect(createdInstances.length).equals(2);
      expect(createdInstances).matchPattern(
        `[{
        recipient_id: ${fixtures.userAlice.id},
        ...
      },
      {
        recipient_id: ${fixtures.userBill.id},
        ...
      }]`,
      );

      await ClassEmail.destroy({});
      await ClassEmailInstance.destroy({});

    });

    it('should create the email and schedule it for later sending, if send time has not passed', async () => {
      await ClassEmail.destroy({});
      MockDate.set(moment.tz('2020-05-15 15:59:00', 'YYYY-MM-DD HH:mm:ss', 'Europe/Copenhagen'));

      await supertest(sails.hooks.http.app)
        .post('/class-emails?client=' + testClientId)
        .send(emailTemplate)
        .use(authorizeAdmin())
        .expect(200);

      expect(emailSendFake.callCount).equals(0);


      const createdEmails = await ClassEmail.find({});
      expect(createdEmails.length).equals(1);
      expect(createdEmails[0]).matchPattern(
        `{
        email_sent: false,
        send_to_signups: true,
        send_to_waiting_list: true,
        send_to_subsequent_signups: true,
        sender_id: ${fixtures.userAdmin.id},
        auto_send_status: 'active'
        ...
      }`,
      );

      const createdInstances = await ClassEmailInstance.find({class_email_id: createdEmails[0].id});
      expect(createdInstances.length).equals(0);


      await ClassEmail.destroy({});

    });

    it('should set auto_send_status = "off" when send_to_subsequent_signups is false', async () => {
      await ClassEmail.destroy({});

      MockDate.set(moment.tz('2020-05-15 15:59:00', 'YYYY-MM-DD HH:mm:ss', 'Europe/Copenhagen'));

      const customEmailTemplate = _.chain(emailTemplate)
        .cloneDeep()
        .assign({send_to_subsequent_signups: false})
        .value();

      await supertest(sails.hooks.http.app)
        .post('/class-emails?client=' + testClientId)
        .send(customEmailTemplate)
        .use(authorizeAdmin())
        .expect(200);

      expect(emailSendFake.callCount).equals(0);


      const createdEmails = await ClassEmail.find({});
      expect(createdEmails.length).equals(1);
      expect(createdEmails[0]).matchPattern(
        `{
        email_sent: false,
        send_to_signups: true,
        send_to_waiting_list: true,
        send_to_subsequent_signups: false,
        sender_id: ${fixtures.userAdmin.id},
        auto_send_status: 'off'
        ...
      }`,
      );

      const createdInstances = await ClassEmailInstance.find({class_email_id: createdEmails[0].id});
      expect(createdInstances.length).equals(0);


      await ClassEmail.destroy({});

    });

    it('should set auto_send_status = "off" if class has started, even if send_to_subsequent_signups is true', async () => {
      await ClassEmail.destroy({});

      MockDate.set(moment.tz('2020-05-15 20:00:00', 'YYYY-MM-DD HH:mm:ss', 'Europe/Copenhagen'));

      const customEmailTemplate = _.chain(emailTemplate)
        .cloneDeep()
        .assign({
          send_to_subsequent_signups: true,
          send_at_datetime: '2020-05-15 20:00:00',
        })
        .value();

      await supertest(sails.hooks.http.app)
        .post('/class-emails?client=' + testClientId)
        .send(customEmailTemplate)
        .use(authorizeAdmin())
        .expect(200);

      expect(emailSendFake.callCount).equals(2);


      const createdEmails = await ClassEmail.find({});
      expect(createdEmails.length).equals(1);
      expect(createdEmails[0]).matchPattern(
        `{
        email_sent: true,
        send_to_signups: true,
        send_to_waiting_list: true,
        send_to_subsequent_signups: false,
        sender_id: ${fixtures.userAdmin.id},
        auto_send_status: 'off'
        ...
      }`,
      );

      const createdInstances = await ClassEmailInstance.find({class_email_id: createdEmails[0].id});
      expect(createdInstances.length).equals(2);

      await ClassEmail.destroy({});
      await ClassEmailInstance.destroy({});

    });

  });

  describe('teacher', async () => {

    it('should throw forbidden if teacher is not teaching the class', async () => {

      await supertest(sails.hooks.http.app)
        .post('/class-emails?client=' + testClientId)
        .send(emailTemplate)
        .use(authorizeTeacherFiona())
        .expect(403);

    });

    it('should pass if teacher is teaching the class', async () => {

      await supertest(sails.hooks.http.app)
        .post('/class-emails?client=' + testClientId)
        .send(emailTemplate)
        .use(authorizeTeacherEvelyn())
        .expect(200);

      await ClassEmail.destroy({});
      await ClassEmailInstance.destroy({});

    });

    it('should pass if teacher can manage all classes', async () => {

      const fionaAllAccessStatus = fixtures.userFiona.teacher_can_manage_all_classes;
      await User.update({id: fixtures.userFiona.id}, {teacher_can_manage_all_classes: true});

      await supertest(sails.hooks.http.app)
        .post('/class-emails?client=' + testClientId)
        .send(emailTemplate)
        .use(authorizeTeacherFiona())
        .expect(200);

      await ClassEmail.destroy({});
      await ClassEmailInstance.destroy({});
      await User.update({id: fixtures.userFiona.id}, {teacher_can_manage_all_classes: fionaAllAccessStatus});

    });

    it('should pass if teacher is also admin', async () => {

      const fionaAdminStatus = fixtures.userFiona.admin;
      await User.update({id: fixtures.userFiona.id}, {admin: true});

      await supertest(sails.hooks.http.app)
        .post('/class-emails?client=' + testClientId)
        .send(emailTemplate)
        .use(authorizeTeacherFiona())
        .expect(200);

      await ClassEmail.destroy({});
      await ClassEmailInstance.destroy({});
      await User.update({id: fixtures.userFiona.id}, {admin: fionaAdminStatus});

    });

  });


});
