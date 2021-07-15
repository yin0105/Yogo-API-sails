const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID;
const fixtures = require('../../../fixtures/factory').fixtures;

const supertest = require('supertest');
const {
  authorizeUserAlice,
  authorizeAdmin,
  authorizeTeacherEvelyn,
  authorizeTeacherFiona
} = require('../../../utils/request-helpers');

const qs = require('qs');

describe('controller.ClassEmails.find', async () => {

  let
    classObjTeacherEvelyn,
    classEmail,
    additionalClassEmail,
    classEmailFromOtherClient,
    classObjTeacherFiona,
    classEmailClassFiona
  ;


  beforeEach(async () => {

    classObjTeacherEvelyn = await Class.create({
      client: testClientId,
      date: '2020-05-15',
      start_time: '20:00:00',
      end_time: '21:00:00',
      class_type: fixtures.classTypeYoga.id,
      teachers: [fixtures.userEvelyn.id],
    }).fetch();

    classEmail = await ClassEmail.create({
      client_id: testClientId,
      class_id: classObjTeacherEvelyn.id,
      sender_id: fixtures.userAdmin.id,
      subject: 'Test subject [first_name] [last_name], [email]',
      body: 'Test body [first_name] [last_name], [email]',
      send_to_signups: true,
      send_to_waiting_list: true,
      send_to_subsequent_signups: true,
      send_at_datetime: '2020-05-15 16:00:00',
    }).fetch();

    additionalClassEmail = await ClassEmail.create({
      class_id: classObjTeacherEvelyn.id,
      client_id: testClientId,
      sender_id: fixtures.userAdmin.id,
      subject: 'Test subject',
      body: 'Test body',
    }).fetch();

    classEmailFromOtherClient = await ClassEmail.create({
      class_id: classObjTeacherEvelyn.id,
      client_id: testClientId + 1,
      sender_id: fixtures.userAdmin.id,
      subject: 'Test subject',
      body: 'Test body',
    }).fetch();

    classObjTeacherFiona = await Class.create({
      client: testClientId,
      date: '2020-05-15',
      start_time: '20:00:00',
      end_time: '21:00:00',
      class_type: fixtures.classTypeYoga.id,
      teachers: [fixtures.userFiona.id],
    }).fetch();

    classEmailClassFiona = await ClassEmail.create({
      client_id: testClientId,
      class_id: classObjTeacherFiona.id,
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
    await ClassEmail.destroy({
      id: [
        classEmail.id,
        additionalClassEmail.id,
        classEmailFromOtherClient.id,
        classEmailClassFiona.id,
      ],
    });
    await Class.destroy({id: [classObjTeacherEvelyn.id, classObjTeacherFiona.id]});
  });

  describe('no relevant user', async () => {

    it('should throw forbidden if user is not admin or teacher', async () => {

      await supertest(sails.hooks.http.app)
        .get(`/class-emails/${classEmail.id}?client=${testClientId}`)
        .expect(403);

      await supertest(sails.hooks.http.app)
        .get(`/class-emails/${classEmail.id}?client=${testClientId}`)
        .use(authorizeUserAlice())
        .expect(403);

    });

  })

  describe('admin', async () => {

    it('should throw forbidden if one of the requested emails is from another client', async () => {

      const queryString = qs.stringify({
        id: [
          classEmail.id,
          classEmailFromOtherClient.id,
        ],
        client: testClientId,
      });

      await supertest(sails.hooks.http.app)
        .get(`/class-emails?${queryString}`)
        .use(authorizeAdmin())
        .expect(403);

    });

    it('should throw notFound if one of the requested emails is archived', async () => {

      await ClassEmail.update({id: classEmail.id}, {archived: true});

      const queryString = qs.stringify({
        id: [
          classEmail.id,
          additionalClassEmail.id,
        ],
        client: testClientId,
      });


      // TODO: Test with teacherEvelyn
      await supertest(sails.hooks.http.app)
        .get(`/class-emails?${queryString}`)
        .use(authorizeAdmin())
        .expect(404);

      const queryString2 = qs.stringify({
        id: [
          classEmail.id,
        ],
        client: testClientId,
      });


      // TODO: Test with teacherEvelyn
      await supertest(sails.hooks.http.app)
        .get(`/class-emails?${queryString2}`)
        .use(authorizeAdmin())
        .expect(404);

    });

    it('should return the class email, specified by route parameter', async () => {

      const {body: response} = await supertest(sails.hooks.http.app)
        .get(`/class-emails/${classEmail.id}?client=${testClientId}`)
        .use(authorizeAdmin())
        .expect(200);

      expect(response).to.matchPattern(
        `{
        id: ${classEmail.id},  
        archived: 0,      
        client_id: ${testClientId},
        class_id: ${classObjTeacherEvelyn.id},
        sender_id: ${fixtures.userAdmin.id},
        subject: 'Test subject [first_name] [last_name], [email]',
        body: 'Test body [first_name] [last_name], [email]',
        send_to_signups: true,
        send_to_waiting_list: true,
        send_to_livestream_signups: false,
        send_to_subsequent_signups: true,
        send_at_datetime: '2020-05-15 16:00:00',
        now_processing: false,
        email_sent: false,
        auto_send_status: '',
        createdAt: _.isInteger,
        updatedAt: _.isInteger
      }`,
      );

    });

    it('should return the class email, specified by query parameter', async () => {

      const {body: response} = await supertest(sails.hooks.http.app)
        .get(`/class-emails?id=${classEmail.id}&client=${testClientId}`)
        .use(authorizeAdmin())
        .expect(200);

      expect(response).to.matchPattern(
        `{
        id: ${classEmail.id},        
        ...
      }`,
      );

    });

    it('should return two class emails, specified by query parameter array', async () => {

      const queryString = qs.stringify({
        id: [
          classEmail.id,
          additionalClassEmail.id,
        ],
        client: testClientId,
      });

      const {body: response} = await supertest(sails.hooks.http.app)
        .get(`/class-emails?${queryString}`)
        .use(authorizeAdmin())
        .expect(200);

      expect(response).to.matchPattern(
        `[
        {
          id: ${classEmail.id},        
          ...
        },
        {
          id: ${additionalClassEmail.id},        
          ...
        },
      ]`,
      );

    });

  });

  describe('teacher without access to all classes', async () => {

    it('should throw forbidden if teacher is not teaching the class, class specified as route parameter', async () => {

      await supertest(sails.hooks.http.app)
        .get(`/class-emails/${classEmail.id}?client=${testClientId}`)
        .use(authorizeTeacherFiona())
        .expect(403);

    });

    it('should throw forbidden if teacher is not teaching the class, class specified as query parameter', async () => {

      await supertest(sails.hooks.http.app)
        .get(`/class-emails?id=${classEmail.id}&client=${testClientId}`)
        .use(authorizeTeacherFiona())
        .expect(403);

    });

    it('should throw forbidden if teacher is not teaching one of the classes, emails specified as query parameter array', async () => {

      const queryString = qs.stringify({
        id: [
          classEmail.id,
          classEmailClassFiona.id,
        ],
        client: testClientId,
      });

      await supertest(sails.hooks.http.app)
        .get(`/class-emails?${queryString}`)
        .use(authorizeTeacherEvelyn())
        .expect(403);

    });

    it('should throw notFound if one of the requested email is archived', async () => {

      await ClassEmail.update({id: classEmail.id}, {archived: true});

      const queryString = qs.stringify({
        id: [
          classEmail.id,
          additionalClassEmail.id,
        ],
        client: testClientId,
      });


      await supertest(sails.hooks.http.app)
        .get(`/class-emails?${queryString}`)
        .use(authorizeTeacherEvelyn())
        .expect(404);

      const queryString2 = qs.stringify({
        id: [
          classEmail.id,
        ],
        client: testClientId,
      });


      await supertest(sails.hooks.http.app)
        .get(`/class-emails?${queryString2}`)
        .use(authorizeTeacherEvelyn())
        .expect(404);

    });

    it('should return the class email, specified by route parameter', async () => {

      const {body: response} = await supertest(sails.hooks.http.app)
        .get(`/class-emails/${classEmail.id}?client=${testClientId}`)
        .use(authorizeTeacherEvelyn())
        .expect(200);

      expect(response).to.matchPattern(
        `{
        id: ${classEmail.id},        
        ...
      }`,
      );

    });

    it('should return the class email, specified by query parameter', async () => {

      const {body: response} = await supertest(sails.hooks.http.app)
        .get(`/class-emails?id=${classEmail.id}&client=${testClientId}`)
        .use(authorizeTeacherEvelyn())
        .expect(200);

      expect(response).to.matchPattern(
        `{
        id: ${classEmail.id},        
        ...
      }`,
      );

    });

    it('should return two class emails, specified by query parameter array', async () => {

      const queryString = qs.stringify({
        id: [
          classEmail.id,
          additionalClassEmail.id,
        ],
        client: testClientId,
      });

      const {body: response} = await supertest(sails.hooks.http.app)
        .get(`/class-emails?${queryString}`)
        .use(authorizeTeacherEvelyn())
        .expect(200);

      expect(response).to.matchPattern(
        `[
        {
          id: ${classEmail.id},        
          ...
        },
        {
          id: ${additionalClassEmail.id},        
          ...
        },
      ]`,
      );

    });

  });

  describe('teacher with access to all classes', async () => {

    let evelynAllAccessStatus;

    before(async () => {
      evelynAllAccessStatus = fixtures.userEvelyn.teacher_can_manage_all_classes;
      await User.update({id: fixtures.userEvelyn.id}, {teacher_can_manage_all_classes: true});
      fixtures.userEvelyn.teacher_can_manage_all_classes = true;
    });

    after(async () => {
      fixtures.userEvelyn.teacher_can_manage_all_classes = evelynAllAccessStatus;
      await User.update({id: fixtures.userEvelyn.id}, {teacher_can_manage_all_classes: evelynAllAccessStatus});
    })


    it('should throw forbidden if one of the requested emails is from another client', async () => {

      const queryString = qs.stringify({
        id: [
          classEmail.id,
          classEmailFromOtherClient.id,
        ],
        client: testClientId,
      });

      await supertest(sails.hooks.http.app)
        .get(`/class-emails?${queryString}`)
        .use(authorizeTeacherEvelyn())
        .expect(403);

    });

    it('should throw notFound if one of the requested emails is archived', async () => {

      await ClassEmail.update({id: classEmail.id}, {archived: true});

      const queryString = qs.stringify({
        id: [
          classEmail.id,
          additionalClassEmail.id,
        ],
        client: testClientId,
      });

      await supertest(sails.hooks.http.app)
        .get(`/class-emails?${queryString}`)
        .use(authorizeTeacherEvelyn())
        .expect(404);

      const queryString2 = qs.stringify({
        id: [
          classEmail.id,
        ],
        client: testClientId,
      });

      await supertest(sails.hooks.http.app)
        .get(`/class-emails?${queryString2}`)
        .use(authorizeTeacherEvelyn())
        .expect(404);

    });

    it('should return the class email, specified by route parameter', async () => {

      const {body: response} = await supertest(sails.hooks.http.app)
        .get(`/class-emails/${classEmail.id}?client=${testClientId}`)
        .use(authorizeTeacherEvelyn())
        .expect(200);

      expect(response).to.matchPattern(
        `{
        id: ${classEmail.id},        
        ...
      }`,
      );

    });

    it('should return the class email, specified by query parameter', async () => {

      const {body: response} = await supertest(sails.hooks.http.app)
        .get(`/class-emails?id=${classEmail.id}&client=${testClientId}`)
        .use(authorizeTeacherEvelyn())
        .expect(200);

      expect(response).to.matchPattern(
        `{
        id: ${classEmail.id},        
        ...
      }`,
      );

    });

    it('should return two class emails, specified by query parameter array', async () => {

      const queryString = qs.stringify({
        id: [
          classEmail.id,
          additionalClassEmail.id,
        ],
        client: testClientId,
      });

      const {body: response} = await supertest(sails.hooks.http.app)
        .get(`/class-emails?${queryString}`)
        .use(authorizeTeacherEvelyn())
        .expect(200);

      expect(response).to.matchPattern(
        `[
        {
          id: ${classEmail.id},        
          ...
        },
        {
          id: ${additionalClassEmail.id},        
          ...
        },
      ]`,
      );

    });

  });

  describe('teacher who is also admin', async () => {

    let evelynAdminStatus;

    before(async () => {
      evelynAdminStatus = fixtures.userEvelyn.admin;
      await User.update({id: fixtures.userEvelyn.id}, {admin: true});
      fixtures.userEvelyn.admin = true;
    });

    after(async () => {
      fixtures.userEvelyn.admin = evelynAdminStatus;
      await User.update({id: fixtures.userEvelyn.id}, {admin: evelynAdminStatus});
    })


    it('should throw forbidden if one of the requested emails is from another client', async () => {

      const queryString = qs.stringify({
        id: [
          classEmail.id,
          classEmailFromOtherClient.id,
        ],
        client: testClientId,
      });

      await supertest(sails.hooks.http.app)
        .get(`/class-emails?${queryString}`)
        .use(authorizeTeacherEvelyn())
        .expect(403);

    });

    it('should throw notFound if one of the requested emails is archived', async () => {

      await ClassEmail.update({id: classEmail.id}, {archived: true});

      const queryString = qs.stringify({
        id: [
          classEmail.id,
          additionalClassEmail.id,
        ],
        client: testClientId,
      });

      await supertest(sails.hooks.http.app)
        .get(`/class-emails?${queryString}`)
        .use(authorizeTeacherEvelyn())
        .expect(404);

      const queryString2 = qs.stringify({
        id: [
          classEmail.id,
        ],
        client: testClientId,
      });

      await supertest(sails.hooks.http.app)
        .get(`/class-emails?${queryString2}`)
        .use(authorizeTeacherEvelyn())
        .expect(404);

    });

    it('should return the class email, specified by route parameter', async () => {

      const {body: response} = await supertest(sails.hooks.http.app)
        .get(`/class-emails/${classEmail.id}?client=${testClientId}`)
        .use(authorizeTeacherEvelyn())
        .expect(200);

      expect(response).to.matchPattern(
        `{
        id: ${classEmail.id},        
        ...
      }`,
      );

    });

    it('should return the class email, specified by query parameter', async () => {

      const {body: response} = await supertest(sails.hooks.http.app)
        .get(`/class-emails?id=${classEmail.id}&client=${testClientId}`)
        .use(authorizeTeacherEvelyn())
        .expect(200);

      expect(response).to.matchPattern(
        `{
        id: ${classEmail.id},        
        ...
      }`,
      );

    });

    it('should return two class emails, specified by query parameter array', async () => {

      const queryString = qs.stringify({
        id: [
          classEmail.id,
          additionalClassEmail.id,
        ],
        client: testClientId,
      });

      const {body: response} = await supertest(sails.hooks.http.app)
        .get(`/class-emails?${queryString}`)
        .use(authorizeTeacherEvelyn())
        .expect(200);

      expect(response).to.matchPattern(
        `[
        {
          id: ${classEmail.id},        
          ...
        },
        {
          id: ${additionalClassEmail.id},        
          ...
        },
      ]`,
      );

    });

  });

});
