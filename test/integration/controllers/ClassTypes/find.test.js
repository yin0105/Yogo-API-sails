const supertest = require('supertest');

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID;
const fixtures = require('../../../fixtures/factory').fixtures;
const qs = require('qs');

describe('controllers.ClassTypes.find', () => {

  it('should return all class types', async () => {

    const {body: classTypes} = await supertest(sails.hooks.http.app)
      .get(`/class-types?client=${testClientId}`)
      .expect(200);

    expect(classTypes).to.matchPattern(`[
      {
        name: 'Yoga',
        image_id: ${fixtures.image1.id},
        image: _.isUndefined,
        ...
      },
      {
        name: 'Hot Yoga',
        image_id: null,
        image: _.isUndefined,
        ...
      },
      {
        name: 'Astanga Yoga',
        ...
      },
      {
        name: 'Dance',
        ...
      },
      {
        name: 'Workout',
        ...
      },
    ]`);

  });

  it('should return a specific class type, route param', async () => {

    const {body: classType} = await supertest(sails.hooks.http.app)
      .get(`/class-types/${fixtures.classTypeYoga.id}?client=${testClientId}`)
      .expect(200);

    expect(classType).to.matchPattern(`
      {
        name: 'Yoga',
        image_id: _.isInteger,
        image: _.isUndefined,
        ...
      }`);

  });

  it('should return a specific class type, query param', async () => {

    const {body: classType} = await supertest(sails.hooks.http.app)
      .get(`/class-types?id=${fixtures.classTypeYoga.id}&client=${testClientId}`)
      .expect(200);

    expect(classType).to.matchPattern(`
      {
        name: 'Yoga',
        image_id: _.isInteger,
        image: _.isUndefined,
        ...
      }`);

  });

  it('should return a specific set of class types', async () => {

    const query = qs.stringify({
      client: testClientId,
      id: [
        fixtures.classTypeYoga.id,
        fixtures.classTypeHotYoga.id,
      ],
    });

    const {body: classTypes} = await supertest(sails.hooks.http.app)
      .get(`/class-types?${query}`)
      .expect(200);

    expect(classTypes).to.matchPattern(`[
      {
        name: 'Yoga',
        image_id: _.isInteger,
        image: _.isUndefined,
        ...
      },
      {
        name: 'Hot Yoga',
        image_id: null,
        image: _.isUndefined,
        ...
      }
    ]`);

  });

  it('should only return class types with classes going forward', async () => {

    let {body: classTypes} = await supertest(sails.hooks.http.app)
      .get(`/class-types?hasClassesFromDateForward=2020-05-16&client=${testClientId}`)
      .expect(200);

    expect(classTypes).to.matchPattern(`[]`);

    const classes = await Class.createEach([
      {
        client: testClientId,
        date: '2020-05-15',
        class_type: fixtures.classTypeYoga.id,
      },
      {
        client: testClientId + 1,
        date: '2020-05-16',
        class_type: fixtures.classTypeYoga.id,
      },
      {
        client: testClientId,
        date: '2020-05-16',
        class_type: fixtures.classTypeHotYoga.id,
      },
    ]).fetch();

    ({body: classTypes} = await supertest(sails.hooks.http.app)
      .get(`/class-types?hasClassesFromDateForward=2020-05-16&client=${testClientId}`)
      .expect(200));

    expect(classTypes).to.matchPattern(`[
    {
      name: 'Hot Yoga',
      ...
    }
    ]`);

    await Class.destroy({id: _.map(classes, 'id')});

  });

  it('should populate relations', async () => {

    const classTypeEmails = await ClassTypeEmail.createEach([
      {
        client_id:testClientId,
        class_types: [fixtures.classTypeYoga.id, fixtures.classTypeHotYoga.id],
        send_at: 'signup',
        subject: 'You have signed up for [class_type]'
      },
      {
        client_id:testClientId,
        class_types: [fixtures.classTypeYoga.id],
        send_at: 'minutes_before_class',
        minutes_before_class: 30,
        subject: 'Remember [class_type]'
      },
    ]).fetch();

    const query = qs.stringify({
      client: testClientId,
      populate: [
        'image',
        'class_pass_types',
        'membership_types',
        'class_pass_types_livestream',
        'membership_types_livestream',
        'class_type_emails',
      ],
    });

    const {body: classTypes} = await supertest(sails.hooks.http.app)
      .get(`/class-types?${query}`)
      .expect(200);

    const sortedClassTypes = _.sortBy(classTypes, 'name');

    expect(sortedClassTypes).to.matchPattern(`[
      {
        name: 'Astanga Yoga',
        ...
      },
      {
        name: 'Dance',
        ...
      },
      {
        name: 'Hot Yoga',
        image: null,
        ...
      },
      {
        name: 'Workout',
        ...
      },
      {
        name: 'Yoga',
        image: {id: ${fixtures.image1.id}, ...},
        class_pass_types: [
          {id: ${fixtures.classPassTypeYogaUnlimitedOneMonth.id}, ...},
          {id: ${fixtures.classPassTypeYogaTenClasses.id}, ...},
          {id: ${fixtures.classPassTypeYogaOneClassIntroOffer.id}, ...},
          {id: ${fixtures.classPassTypeYogaOneClassIntroOfferThreePerCustomer.id}, ...},
          {id: ${fixtures.classPassTypeYogaOneClassIntroOfferFree.id}, ...}
        ],
        membership_types: [
          {id: ${fixtures.membershipTypeYogaUnlimited.id}, ...},
          {id: ${fixtures.membershipTypeYogaTwoClassesPerWeek.id}, ...}          
        ],
        class_pass_types_livestream: [
          {id: ${fixtures.classPassTypeYogaUnlimitedOneMonthLivestream.id}, ...},
          {id: ${fixtures.classPassTypeYogaTenClasses.id}, ...},
          {id: ${fixtures.classPassTypeYogaTenClassesLivestream.id}, ...},
        ],
        membership_types_livestream: [
          {id: ${fixtures.membershipTypeYogaUnlimited.id}, ...},
          {id: ${fixtures.membershipTypeYogaTwoClassesPerWeek.id}, ...},
          {id: ${fixtures.membershipTypeYogaUnlimitedLivestream.id}, ...},
        ], 
        class_type_emails: [
          {id: ${classTypeEmails[0].id}, send_at: 'signup', ...},
          {id: ${classTypeEmails[1].id}, send_at: 'minutes_before_class', ...},          
        ],       
        ...
      },                     
    ]`);

    await ClassTypeEmail.destroy({id: _.map(classTypeEmails, 'id')});

  });

});
