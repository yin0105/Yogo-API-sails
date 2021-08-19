const supertest = require('supertest');
const {authorizeAdmin, authorizeUserAlice} = require('../../../utils/request-helpers');

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID;
const fixtures = require('../../../fixtures/factory').fixtures;

describe('controllers.ClassTypes.destroy', () => {

  let classType;

  beforeEach(async () => {
    classType = await ClassType.create({
      client: testClientId,
      name: 'Test class type',
      color: '#0000ff',
    }).fetch();
  });

  afterEach(async () => {
    await ClassType.destroy({id: classType.id});
    classType = null;
  })

  it('should deny access if user is not logged in', async () => {

    await supertest(sails.hooks.http.app)
      .delete(`/class-types/${classType.id}?client=${testClientId}`)
      .expect(403);

  });

  it('should deny access if user is not admin', async () => {

    await supertest(sails.hooks.http.app)
      .delete(`/class-types/${classType.id}?client=${testClientId}`)
      .use(authorizeUserAlice())
      .expect(403);

  });

  it('should return 400 badRequest if class type does not exist', async () => {

    await supertest(sails.hooks.http.app)
      .delete(`/class-types/99999999?client=${testClientId}`)
      .use(authorizeAdmin())
      .expect(400);

  });

  it('should pass if class type is already archived', async () => {

    await ClassType.update({id: classType.id}, {archived: true});

    await supertest(sails.hooks.http.app)
      .delete(`/class-types/${classType.id}?client=${testClientId}`)
      .use(authorizeAdmin())
      .expect(200);

  });

  it('should archive class type', async () => {

    const classTypeEmail = await ClassTypeEmail.create({
      client_id: testClientId,
      send_at: 'signup'
    }).fetch();

    await ClassType.update({id: classType.id}, {
      membership_types: [fixtures.membershipTypeYogaUnlimited.id],
      membership_types_livestream: [fixtures.membershipTypeYogaUnlimitedLivestream.id],
      class_pass_types: [fixtures.classPassTypeYogaTenClasses.id],
      class_pass_types_livestream: [fixtures.classPassTypeYogaTenClassesLivestream.id],
      class_type_emails: [classTypeEmail.id],
    })

    await supertest(sails.hooks.http.app)
      .delete(`/class-types/${classType.id}?client=${testClientId}`)
      .use(authorizeAdmin())
      .expect(200);


    const ClassTypeObjection = require('../../../../api/objection-models/ClassType');
    const populatedClassType = await ClassTypeObjection.query()
      .where('id',classType.id)
      .eager({
        membership_types: true,
        membership_types_livestream: true,
        class_pass_types: true,
        class_pass_types_livestream: true,
        class_type_emails: true,
      });

    expect(populatedClassType).to.matchPattern(`[{      
      archived: 1,
      membership_types: [],
      membership_types_livestream: [],
      class_pass_types: [],
      class_pass_types_livestream: [],
      class_type_emails: [],
      ...
    }]`);

    await ClassTypeEmail.destroy({id: classTypeEmail.id});

  });

  it('should archive class type image', async () => {

    const image = await Image.create({
      name: 'Test image',
      expires: 0,
    }).fetch();

    await ClassType.update({id: classType.id}, {
      image: image.id,
    })

    await supertest(sails.hooks.http.app)
      .delete(`/class-types/${classType.id}?client=${testClientId}`)
      .use(authorizeAdmin())
      .expect(200);

    const archivedClassType = await ClassType.findOne(classType.id);

    expect(archivedClassType).to.matchPattern(`{      
      id: ${classType.id},
      archived: true,
      image: ${image.id},
      ...
    }`);

    const updatedImage = await Image.findOne(image.id);
    expect(updatedImage).to.matchPattern(`{
      archived: true,
      expires: 0,
      ...
    }`);

    await Image.destroy({id: image.id});

  });


});
