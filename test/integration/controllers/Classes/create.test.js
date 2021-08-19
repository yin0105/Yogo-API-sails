const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID;
const fixtures = require('../../../fixtures/factory').fixtures;

const supertest = require('supertest');
const {authorizeUserAlice, authorizeAdmin} = require('../../../utils/request-helpers');

describe('controllers.Classes.create', async function () {

  let classTemplate;

  before(async () => {
    classTemplate = {
      date: '2018-05-15',
      start_time: '10:00:00',
      end_time: '12:00:00',
      class_type: fixtures.classTypeYoga.id,
      subtitle: '',
      teachers: [
        fixtures.userAlice.id,
        fixtures.userBill.id,
      ],
      room: null,
      seats: 20,
    };
  });

  it('should throw forbidden if user is not admin', async () => {

    await supertest(sails.hooks.http.app)
      .post('/classes?client=' + testClientId)
      .send(classTemplate)
      .expect(403);

    await supertest(sails.hooks.http.app)
      .post('/classes?client=' + testClientId)
      .send(classTemplate)
      .use(authorizeUserAlice())
      .expect(403);

  });

  it('should create and return the class', async () => {

    const {body: createdClass} = await supertest(sails.hooks.http.app)
      .post('/classes?client=' + testClientId)
      .send(classTemplate)
      .use(authorizeAdmin())
      .expect(200);

    expect(createdClass).to.matchPattern(
      `{
        id: _.isInteger,
        createdAt: _.isInteger,
        updatedAt: _.isInteger,
        archived: false,
        client: ${testClientId},
        date: '2018-05-15',
        start_time: '10:00',
        end_time: '12:00',
        class_type: ${fixtures.classTypeYoga.id},
        subtitle: '',        
        room: null,
        seats: 20,
        cancelled: false,
        studio_attendance_enabled: true,
        livestream_enabled: false,
        classpass_com_enabled: null,
        classpass_com_all_seats_allowed: null,
        classpass_com_number_of_seats_allowed: null,
      }`
    )

    const createdClassInDb = await Class.findOne({id: createdClass.id}).populate('teachers');

    expect(createdClassInDb).to.matchPattern(
      `{
        id: _.isInteger,
        createdAt: _.isInteger,
        updatedAt: _.isInteger,
        client: ${testClientId},
        archived: false,
        date: _.isDate,
        start_time: '10:00:00',
        end_time: '12:00:00',
        class_type: ${fixtures.classTypeYoga.id},
        subtitle: '',
        teachers: [
          {
            id: ${fixtures.userAlice.id},
            ...
          },
          {
            id: ${fixtures.userBill.id},
            ...
          },
        ],
        room: null,
        seats: 20,
        cancelled: false,
        studio_attendance_enabled: true,
        livestream_enabled: false,
        classpass_com_enabled: null,
        classpass_com_all_seats_allowed: null,
        classpass_com_number_of_seats_allowed: null,
      }`
    )
    expect(createdClassInDb.date.toISOString()).to.equal('2018-05-15T00:00:00.000Z')

    await Class.destroy({id: createdClass.id});

  });

});
