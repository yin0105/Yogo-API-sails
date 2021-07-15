const supertest = require('supertest');
const {authorizeAdmin, authorizeUserAlice} = require('../../../utils/request-helpers');

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID;
const fixtures = require('../../../fixtures/factory').fixtures;

describe('controllers.ClassTypes.create', () => {

  it('should deny access if user is not logged in', async () => {

    await supertest(sails.hooks.http.app)
      .post(`/class-types?client=${testClientId}`,
        {
          name: 'Test',
        },
      )
      .expect(403);

  });

  it('should deny access if user is not admin', async () => {

    await supertest(sails.hooks.http.app)
      .post(`/class-types?client=${testClientId}`,
        {
          name: 'Test',
        },
      )
      .use(authorizeUserAlice())
      .expect(403);

  });

  it('should create class type', async () => {

    const {body: createdClassType} = await supertest(sails.hooks.http.app)
      .post(`/class-types?client=${testClientId}`)
      .send({
        name: 'Test',
        color: '#ff0000',
      })
      .use(authorizeAdmin())
      .expect(200);

    expect(createdClassType).to.matchPattern(`{
      client: ${testClientId},
      name: 'Test',
      image: null,
      color: '#ff0000',
      id: _.isInteger,
      ...
    }`);

    await ClassType.destroy({id: createdClassType.id});

  });

  it('should create class type with relations', async () => {

    const image = await Image.create({
      name: 'Test image',
      expires: Date.now() + 10000,
    }).fetch();

    const classTypeEmail = await ClassTypeEmail.create({
      client_id: testClientId,
      send_at: 'signup'
    }).fetch();

    const {body: createdClassType} = await supertest(sails.hooks.http.app)
      .post(`/class-types?client=${testClientId}`)
      .send({
        name: 'Test',
        color: '#ff0000',
        image: image.id,
        class_pass_types: [fixtures.classPassTypeYogaTenClasses.id],
        class_pass_types_livestream: [fixtures.classPassTypeYogaTenClassesLivestream.id],
        membership_types: [fixtures.membershipTypeYogaUnlimited.id],
        membership_types_livestream: [fixtures.membershipTypeYogaUnlimitedLivestream.id],
        class_type_emails: [classTypeEmail.id],
      })
      .use(authorizeAdmin())
      .expect(200);

    expect(createdClassType).to.matchPattern(`{
      client: ${testClientId},
      name: 'Test',
      image: ${image.id},
      id: _.isInteger,
      ...
    }`);

    const ClassTypeObjection = require('../../../../api/objection-models/ClassType');
    const dbClassType = await ClassTypeObjection.query()
      .where({id: createdClassType.id})
      .first()
      .eager({
        class_pass_types: true,
        class_pass_types_livestream: true,
        membership_types: true,
        membership_types_livestream: true,
        class_type_emails: true,
      });

    expect(dbClassType).to.matchPattern(`{
      id: ${createdClassType.id},
      class_pass_types: [{id: ${fixtures.classPassTypeYogaTenClasses.id}, ...}],
      class_pass_types_livestream: [{id: ${fixtures.classPassTypeYogaTenClassesLivestream.id}, ...}],
      membership_types: [{id: ${fixtures.membershipTypeYogaUnlimited.id}, ...}],
      membership_types_livestream: [{id: ${fixtures.membershipTypeYogaUnlimitedLivestream.id}, ...}],
      class_type_emails: [{id: ${classTypeEmail.id}, ...}],
      ... 
    }`);

    const updatedImage = await Image.findOne(image.id);
    expect(updatedImage).to.matchPattern(`{
      id: ${image.id},
      expires: 0,
      ... 
    }`);

    await ClassType.destroy({id: createdClassType.id});
    await Image.destroy({id: image.id});
    await ClassTypeEmail.destroy({id: classTypeEmail.id});

  });

});
