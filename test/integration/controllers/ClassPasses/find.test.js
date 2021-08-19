const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID;
const fixtures = require('../../../fixtures/factory').fixtures;

const supertest = require('supertest');
const {authorizeUserAlice, authorizeUserBill, authorizeAdmin} = require('../../../utils/request-helpers');
const qs = require('qs');
const MockDate = require('mockdate');
const moment = require('moment-timezone');

describe('controllers.ClassPasses.find', async function () {

  let classPasses;

  before(async () => {
    await ClassPass.destroy({});
    classPasses = {

      alice1: await ClassPass.create({
        client: testClientId,
        user: fixtures.userAlice.id,
        class_pass_type: fixtures.classPassTypeYogaUnlimitedOneMonth.id,
        start_date: '2020-04-15',
        valid_until: '2020-05-15',
      }).fetch(),

      alice2: await ClassPass.create({
        client: testClientId,
        user: fixtures.userAlice.id,
        class_pass_type: fixtures.classPassTypeYogaTenClasses.id,
        start_date: '2020-04-15',
        classes_left: 5,
        valid_until: '2020-05-15',
      }).fetch(),

      aliceArchived: await ClassPass.create({
        client: testClientId,
        user: fixtures.userAlice.id,
        class_pass_type: fixtures.classPassTypeYogaUnlimitedOneMonth.id,
        start_date: '2020-04-15',
        valid_until: '2020-05-15',
        archived: true,
      }).fetch(),

      bill: await ClassPass.create({
        client: testClientId,
        user: fixtures.userBill.id,
        class_pass_type: fixtures.classPassTypeYogaUnlimitedOneMonth.id,
        start_date: '2020-04-15',
        valid_until: '2020-05-15',
      }).fetch(),

      billOtherClient: await ClassPass.create({
        client: testClientId + 1,
        user: fixtures.userBill.id,
        class_pass_type: fixtures.classPassTypeYogaUnlimitedOneMonth.id,
        start_date: '2020-04-15',
        valid_until: '2020-05-15',
      }).fetch(),
    };

  });

  after(async () => {
    await ClassPass.destroy({id: _.map(_.values(classPasses), 'id')});
  });

  it('should throw badRequest if neither id or user is specified', async () => {

    await supertest(sails.hooks.http.app)
      .get(`/class-passes?client=${testClientId}`)
      .use(authorizeAdmin())
      .expect(400);

  });

  describe('search by ID', async () => {

    it('should throw forbidden if user is not logged in', async () => {

      await supertest(sails.hooks.http.app)
        .get(`/class-passes?client=${testClientId}&id=${classPasses.alice1.id}`)
        .expect(403);

    });

    it('should throw forbidden if user is not admin and class pass is for another user', async () => {

      await supertest(sails.hooks.http.app)
        .get(`/class-passes?client=${testClientId}&id=${classPasses.alice1.id}`)
        .use(authorizeUserBill())
        .expect(403);

    });

    it('should throw forbidden if user is admin but class pass is on another client', async () => {

      await supertest(sails.hooks.http.app)
        .get(`/class-passes?client=${testClientId}&id=${classPasses.billOtherClient.id}`)
        .use(authorizeAdmin())
        .expect(403);

    });


    it('should return class pass if user is customer and owns the class pass', async () => {

      const {body: classPass} = await supertest(sails.hooks.http.app)
        .get(`/class-passes?client=${testClientId}&id=${classPasses.alice1.id}`)
        .use(authorizeUserAlice())
        .expect(200);

      expect(classPass).to.matchPattern(`{
        client: ${testClientId},
        id: ${classPasses.alice1.id},
        user_id: ${fixtures.userAlice.id},
        class_pass_type_id: ${fixtures.classPassTypeYogaUnlimitedOneMonth.id},
        valid_until: '2020-05-15',
        ...
      }`);

    });

    it('should return class pass if user is admin and class pass is on the same client', async () => {

      const {body: classPass} = await supertest(sails.hooks.http.app)
        .get(`/class-passes?client=${testClientId}&id=${classPasses.alice1.id}`)
        .use(authorizeAdmin())
        .expect(200);

      expect(classPass).to.matchPattern(`{
        client: ${testClientId},
        id: ${classPasses.alice1.id},
        user_id: ${fixtures.userAlice.id},
        class_pass_type_id: ${fixtures.classPassTypeYogaUnlimitedOneMonth.id},
        valid_until: '2020-05-15',
        ...
      }`);

    });

    it('should return class pass if id is specified as param', async () => {

      const {body: classPass} = await supertest(sails.hooks.http.app)
        .get(`/class-passes/${classPasses.alice1.id}?client=${testClientId}`)
        .use(authorizeAdmin())
        .expect(200);

      expect(classPass).to.matchPattern(`{
        id: ${classPasses.alice1.id},
        ...
      }`);

    });


  });

  describe('search by user', async () => {

    it('should throw forbidden if user is not logged in', async () => {

      await supertest(sails.hooks.http.app)
        .get(`/class-passes?client=${testClientId}&user=${fixtures.userAlice.id}`)
        .expect(403);

    });

    it('should throw forbidden if user is customer and requested user is not the same', async () => {

      await supertest(sails.hooks.http.app)
        .get(`/class-passes?client=${testClientId}&user=${fixtures.userAlice.id}`)
        .use(authorizeUserBill())
        .expect(403);

    });

    it('should throw forbidden if user is admin but requested user is on another client', async () => {

      const userOnOtherClient = await User.create({
        client: testClientId + 1,
        email: 'null@yogo.dk',
      }).fetch();

      await supertest(sails.hooks.http.app)
        .get(`/class-passes?client=${testClientId}&user=${userOnOtherClient.id}`)
        .use(authorizeAdmin())
        .expect(403);

      await User.destroy({id: userOnOtherClient.id});

    });

    it('should return class pass if user is customer and requested user is the same', async () => {

      const {body: foundClassPasses} = await supertest(sails.hooks.http.app)
        .get(`/class-passes?client=${testClientId}&user=${fixtures.userAlice.id}`)
        .use(authorizeUserAlice())
        .expect(200);

      foundClassPasses.sort((a, b) => {
        return a.id > b.id ? 1: -1;
      })

      expect(foundClassPasses).to.matchPattern(`[{
        client: ${testClientId},
        id: ${classPasses.alice1.id},
        user_id: ${fixtures.userAlice.id},
        class_pass_type_id: ${fixtures.classPassTypeYogaUnlimitedOneMonth.id},
        valid_until: '2020-05-15',
        ...
      },
      {
        client: ${testClientId},
        id: ${classPasses.alice2.id},
        user_id: ${fixtures.userAlice.id},
        class_pass_type_id: ${fixtures.classPassTypeYogaTenClasses.id},
        valid_until: '2020-05-15',
        ...
      }]`);

    });

  });

  describe('populate', async () => {

    it('should populate valid fields', async () => {

      await ClassPassLog.createEach([
        {
          client_id: testClientId,
          class_pass_id: classPasses.alice1.id,
          entry: 'Test entry 1',
        },
        {
          client_id: testClientId,
          class_pass_id: classPasses.alice1.id,
          entry: 'Test entry 2',
        },
      ]).fetch();

      const queryString = qs.stringify({
        client: testClientId,
        populate: [
          'user',
          'log_entries',
          'class_pass_type',
          'class_pass_type.class_types',
        ],
      });

      const {body: classPass} = await supertest(sails.hooks.http.app)
        .get(`/class-passes/${classPasses.alice1.id}?${queryString}`)
        .use(authorizeUserAlice())
        .expect(200);

      expect(classPass).to.matchPattern(`{
        client: ${testClientId},
        id: ${classPasses.alice1.id},
        user_id: ${fixtures.userAlice.id},
        class_pass_type_id: ${fixtures.classPassTypeYogaUnlimitedOneMonth.id},
        valid_until: '2020-05-15',
        log_entries: [
          {
            entry: 'Test entry 1',
            ...
          },
          {
            entry: 'Test entry 2',
            ...
          },
        ],
        user: {
          id: ${fixtures.userAlice.id},
          ...
        },
        class_pass_type: {
          id: ${fixtures.classPassTypeYogaUnlimitedOneMonth.id},
          class_types: [
            {
              id: ${fixtures.classTypeYoga.id},
              ...
            }
          ],
          ...
        },            
        ...
      }`);

      await ClassPassLog.destroy({});

    });
  });

});
