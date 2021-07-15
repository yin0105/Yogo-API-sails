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

describe('controller.ClassEmails.destroy', async () => {

  let
    classObj,
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

  });


  after(async () => {
    await Class.destroy({id: classObj.id});

    MockDate.reset();
  });

  beforeEach(async () => {

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
    await ClassEmail.destroy({id: classEmail.id});
  });


  describe('no relevant user', async () => {
    it('should throw forbidden if user is not admin or teacher for the class', async () => {

      await supertest(sails.hooks.http.app)
        .delete(`/class-emails/${classEmail.id}?client=${testClientId}`)
        .expect(403);

      await supertest(sails.hooks.http.app)
        .delete(`/class-emails/${classEmail.id}?client=${testClientId}`)
        .use(authorizeUserAlice())
        .expect(403);

    });
  });

  describe('admin', async () => {

    it('should fail if email is already sent', async () => {
      await ClassEmail.update({id: classEmail.id}, {email_sent: true});

      await supertest(sails.hooks.http.app)
        .delete(`/class-emails/${classEmail.id}?client=${testClientId}`)
        .use(authorizeAdmin())
        .expect('E_COULD_NOT_DELETE_CLASS_EMAIL');
    });

    it('should fail if email is being processed', async () => {
      await ClassEmail.update({id: classEmail.id}, {now_processing: true});

      await supertest(sails.hooks.http.app)
        .delete(`/class-emails/${classEmail.id}?client=${testClientId}`)
        .use(authorizeAdmin())
        .expect('E_COULD_NOT_DELETE_CLASS_EMAIL');
    });

    it('should delete the email if user is admin', async () => {

      await supertest(sails.hooks.http.app)
        .delete(`/class-emails/${classEmail.id}?client=${testClientId}`)
        .use(authorizeAdmin())
        .expect(200);

      const [updatedEmail] = await ClassEmail.find({});
      expect(updatedEmail).matchPattern(
        `{
        archived: true,
        email_sent: false,
        send_to_signups: true,
        send_to_waiting_list: true,
        send_to_subsequent_signups: true,
        sender_id: ${fixtures.userAdmin.id},
        ...
      }`,
      );

    });

    it('should pass if the email is already archived', async () => {

      await ClassEmail.update({id: classEmail.id}, {archived: true});

      await supertest(sails.hooks.http.app)
        .delete(`/class-emails/${classEmail.id}?client=${testClientId}`)
        .use(authorizeAdmin())
        .expect(200);

      const [updatedEmail] = await ClassEmail.find({});
      expect(updatedEmail).matchPattern(
        `{
        archived: true,
        email_sent: false,
        send_to_signups: true,
        send_to_waiting_list: true,
        send_to_subsequent_signups: true,
        sender_id: ${fixtures.userAdmin.id},
        ...
      }`,
      );

    });

  });

  describe('teacher', async () => {
    it('should throw forbidden if teacher is not teaching the class', async () => {

      await supertest(sails.hooks.http.app)
        .delete(`/class-emails/${classEmail.id}?client=${testClientId}`)
        .use(authorizeTeacherFiona())
        .expect(403);

    });

    it('should succeed if teacher is teaching the class', async () => {

      await supertest(sails.hooks.http.app)
        .delete(`/class-emails/${classEmail.id}?client=${testClientId}`)
        .use(authorizeTeacherEvelyn())
        .expect(200);

    });

    it('should succeed if teacher can manage all classes', async () => {

      const fionaAllAccessStatus = fixtures.userFiona.teacher_can_manage_all_classes;
      await User.update({id: fixtures.userFiona.id}, {teacher_can_manage_all_classes: true});

      await supertest(sails.hooks.http.app)
        .delete(`/class-emails/${classEmail.id}?client=${testClientId}`)
        .use(authorizeTeacherFiona())
        .expect(200);

      await User.update({id: fixtures.userFiona.id}, {teacher_can_manage_all_classes: fionaAllAccessStatus});

    });

    it('should succeed if teacher is also admin', async () => {

      const fionaAdminStatus = fixtures.userFiona.admin;
      await User.update({id: fixtures.userFiona.id}, {admin: true});

      await supertest(sails.hooks.http.app)
        .delete(`/class-emails/${classEmail.id}?client=${testClientId}`)
        .use(authorizeTeacherFiona())
        .expect(200);

      await User.update({id: fixtures.userFiona.id}, {admin: fionaAdminStatus});

    });

  });


});
