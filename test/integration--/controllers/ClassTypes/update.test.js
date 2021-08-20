const supertest = require('supertest');
const {authorizeAdmin, authorizeUserAlice} = require('../../../utils/request-helpers');

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID;
const fixtures = require('../../../fixtures/factory').fixtures;

describe('controllers.ClassTypes.update', () => {

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
      .put(`/class-types/${classType.id}?client=${testClientId}`)
      .send(
        {
          name: 'New name',
        },
      )
      .expect(403);

  });

  it('should deny access if user is not admin', async () => {

    await supertest(sails.hooks.http.app)
      .put(`/class-types/${classType.id}?client=${testClientId}`)
      .send(
        {
          name: 'New name',
        },
      )
      .use(authorizeUserAlice())
      .expect(403);

  });

  it('should return 404 "Not found" if class type does not exist', async () => {

    await ClassType.update({id: classType.id}, {archived: true});

    await supertest(sails.hooks.http.app)
      .put(`/class-types/${classType.id}?client=${testClientId}`)
      .send(
        {
          name: 'New name',
        },
      )
      .use(authorizeAdmin())
      .expect(404);

  });

  it('should update class type', async () => {

    const classTypeEmail = await ClassTypeEmail.create({
      client_id: testClientId,
      send_at: 'signup'
    }).fetch();

    const {body: updatedClassType} = await supertest(sails.hooks.http.app)
      .put(`/class-types/${classType.id}?client=${testClientId}`)
      .send({
        name: 'New name',
        color: '#ff0000',
        membership_types: [fixtures.membershipTypeYogaUnlimited.id],
        membership_types_livestream: [fixtures.membershipTypeYogaUnlimitedLivestream.id],
        class_pass_types: [fixtures.classPassTypeYogaTenClasses.id],
        class_pass_types_livestream: [fixtures.classPassTypeYogaTenClassesLivestream.id],
        class_type_emails: [classTypeEmail.id]
      })
      .use(authorizeAdmin())
      .expect(200);

    expect(updatedClassType).to.matchPattern(`{
      client: ${testClientId},
      name: 'New name',
      image: null,
      color: '#ff0000',
      id: ${classType.id},
      ...
    }`);

    const ClassTypeObjection = require('../../../../api/objection-models/ClassType');
    const populatedClassType = await ClassTypeObjection.query()
      .where('id',classType.id)
      .eager({
        membership_types: true,
        membership_types_livestream: true,
        class_pass_types: true,
        class_pass_types_livestream: true,
        class_type_emails: true
      });

    expect(populatedClassType).to.matchPattern(`[{
      name: 'New name',
      color: '#ff0000',
      membership_types: [{id: ${fixtures.membershipTypeYogaUnlimited.id}, ...}],
      membership_types_livestream: [{id: ${fixtures.membershipTypeYogaUnlimitedLivestream.id}, ...}],
      class_pass_types: [{id: ${fixtures.classPassTypeYogaTenClasses.id}, ...}],
      class_pass_types_livestream: [{id: ${fixtures.classPassTypeYogaTenClassesLivestream.id}, ...}],
      class_type_emails: [{id: ${classTypeEmail.id}, ...}],
      ...
    }]`);

    await ClassTypeEmail.destroy({id: classTypeEmail.id});

  });

  it('should add image', async () => {

    const image = await Image.create({
      name: 'Test image',
      expires: Date.now() + 10000,
    }).fetch();

    const {body: updatedClassType} = await supertest(sails.hooks.http.app)
      .put(`/class-types/${classType.id}?client=${testClientId}`)
      .send({
        image: image.id,
      })
      .use(authorizeAdmin())
      .expect(200);

    expect(updatedClassType).to.matchPattern(`{
      client: ${testClientId},
      name: 'Test class type',
      image: ${image.id},
      id: ${classType.id},
      ...
    }`);

    const updatedImage = await Image.findOne(image.id);
    expect(updatedImage).to.matchPattern(`{
      id: ${image.id},
      expires: 0,
      ... 
    }`);

    await Image.destroy({id: image.id});

  });

  it('should update image', async () => {

    const image1 = await Image.create({
      name: 'Test image 1',
      expires: 0,
    }).fetch();

    const image2 = await Image.create({
      name: 'Test image 2',
      expires: Date.now() + 10000,
    }).fetch();

    await ClassType.update({id: classType.id}, {image: image1.id});

    const {body: updatedClassType} = await supertest(sails.hooks.http.app)
      .put(`/class-types/${classType.id}?client=${testClientId}`)
      .send({
        image: image2.id,
      })
      .use(authorizeAdmin())
      .expect(200);

    expect(updatedClassType).to.matchPattern(`{
      client: ${testClientId},
      name: 'Test class type',
      image: ${image2.id},
      id: ${classType.id},
      ...
    }`);

    const updatedImages = await Image.find({id: [image1.id, image2.id]});
    expect(updatedImages).to.matchPattern(`[{
      id: ${image1.id},
      expires: 0,
      archived: true,
      ... 
    },
    {
      id: ${image2.id},
      archived: false,
      expires: 0,
      ... 
    }]`);

    await Image.destroy({id: [image1.id, image2.id]});

  });

  it('should remove image', async () => {

    const image = await Image.create({
      name: 'Test image 1',
      expires: 0,
    }).fetch();

    await ClassType.update({id: classType.id}, {image: image.id});

    const {body: updatedClassType} = await supertest(sails.hooks.http.app)
      .put(`/class-types/${classType.id}?client=${testClientId}`)
      .send({
        image: null,
      })
      .use(authorizeAdmin())
      .expect(200);

    expect(updatedClassType).to.matchPattern(`{
      client: ${testClientId},
      name: 'Test class type',
      image: null,
      id: ${classType.id},
      ...
    }`);

    const updatedImage = await Image.findOne(image.id);
    expect(updatedImage).to.matchPattern(`{
      id: ${image.id},
      expires: 0,
      archived: true,
      ... 
    }`);

    await Image.destroy({id: image.id});

  });


});
