const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID;
const fixtures = require('../../../fixtures/factory').fixtures;

const supertest = require('supertest');
const {authorizeUserAlice, authorizeAdmin} = require('../../../utils/request-helpers');

const MockDate = require('mockdate');
const moment = require('moment-timezone');

describe('controllers.ClassPasses.create', async function () {

  before(async () => {
    await ClassPassLog.destroy({});
  });

  afterEach(async () => {
    await ClassPassLog.destroy({});
  });

  it('should throw forbidden if user is not admin and class pass type is not free', async () => {

    const classPassData = {
      user: fixtures.userAlice.id,
      class_pass_type: fixtures.classPassTypeYogaUnlimitedOneMonth.id,
    };

    await supertest(sails.hooks.http.app)
      .post('/class-passes?client=' + testClientId)
      .send(classPassData)
      .use(authorizeUserAlice())
      .expect(403);

  });

  it('should throw forbidden if user is not admin and class pass is for another user', async () => {

    const classPassData = {
      user: fixtures.userBill.id,
      class_pass_type: fixtures.classPassTypeYogaOneClassIntroOfferFree.id,
    };

    await supertest(sails.hooks.http.app)
      .post('/class-passes?client=' + testClientId)
      .send(classPassData)
      .use(authorizeUserAlice())
      .expect(403);

  });

  it('should throw forbidden if user is customer, class pass is free but user already has reached max number of this type', async () => {

    const existingClassPass = await ClassPass.create({
      class_pass_type: fixtures.classPassTypeYogaOneClassIntroOfferFree.id,
      user: fixtures.userAlice.id,
    }).fetch();

    const classPassData = {
      user: fixtures.userAlice.id,
      class_pass_type: fixtures.classPassTypeYogaOneClassIntroOfferFree.id,
    };

    await supertest(sails.hooks.http.app)
      .post('/class-passes?client=' + testClientId)
      .send(classPassData)
      .use(authorizeUserAlice())
      .expect(403);

    await ClassPass.destroy({id: existingClassPass.id});

  });

  it('should create class pass if user is admin', async () => {

    const classPassData = {
      user: fixtures.userAlice.id,
      class_pass_type: fixtures.classPassTypeYogaUnlimitedOneMonth.id,
    };

    const {body: newClassPass} = await supertest(sails.hooks.http.app)
      .post('/class-passes?client=' + testClientId)
      .send(classPassData)
      .use(authorizeAdmin())
      .expect(200);

    expect(newClassPass).to.matchPattern(`{
      class_pass_type: ${fixtures.classPassTypeYogaUnlimitedOneMonth.id},
      user: ${fixtures.userAlice.id},
      ...
    }`);

    await ClassPass.destroy({id: newClassPass.id});

  });

  it('should create class pass if user is customer and class pass is free', async () => {

    const classPassData = {
      user: fixtures.userAlice.id,
      class_pass_type: fixtures.classPassTypeYogaOneClassIntroOfferFree.id,
    };

    const {body: newClassPass} = await supertest(sails.hooks.http.app)
      .post('/class-passes?client=' + testClientId)
      .send(classPassData)
      .use(authorizeUserAlice())
      .expect(200);

    expect(newClassPass).to.matchPattern(`{
      class_pass_type: ${fixtures.classPassTypeYogaOneClassIntroOfferFree.id},
      user: ${fixtures.userAlice.id},
      ...
    }`);

    await ClassPass.destroy({id: newClassPass.id});

  });

  it('should create class pass if user is customer and class pass is free and user has the class pass but there is no limit per customer', async () => {

    const existingClassPass = await ClassPass.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      class_pass_type: fixtures.classPassTypeYogaOneClassIntroOfferFree.id,
    }).fetch();

    await ClassPassType.update({id: fixtures.classPassTypeYogaOneClassIntroOfferFree.id}, {limited_number_per_customer: false});

    const classPassData = {
      user: fixtures.userAlice.id,
      class_pass_type: fixtures.classPassTypeYogaOneClassIntroOfferFree.id,
    };

    const {body: newClassPass} = await supertest(sails.hooks.http.app)
      .post('/class-passes?client=' + testClientId)
      .send(classPassData)
      .use(authorizeUserAlice())
      .expect(200);

    expect(newClassPass).to.matchPattern(`{
      class_pass_type: ${fixtures.classPassTypeYogaOneClassIntroOfferFree.id},
      user: ${fixtures.userAlice.id},
      ...
    }`);

    await ClassPass.destroy({id: [existingClassPass.id, newClassPass.id]});

    await ClassPassType.update({id: fixtures.classPassTypeYogaOneClassIntroOfferFree.id}, {limited_number_per_customer: true});

  });

  it('should create class pass if user is customer and class pass is free and user has the class pass but the limit per customer is higher', async () => {

    const existingClassPass = await ClassPass.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      class_pass_type: fixtures.classPassTypeYogaOneClassIntroOfferFree.id,
    }).fetch();

    await ClassPassType.update({id: fixtures.classPassTypeYogaOneClassIntroOfferFree.id}, {max_number_per_customer: 2});

    const classPassData = {
      user: fixtures.userAlice.id,
      class_pass_type: fixtures.classPassTypeYogaOneClassIntroOfferFree.id,
    };

    const {body: newClassPass} = await supertest(sails.hooks.http.app)
      .post('/class-passes?client=' + testClientId)
      .send(classPassData)
      .use(authorizeUserAlice())
      .expect(200);

    expect(newClassPass).to.matchPattern(`{
      class_pass_type: ${fixtures.classPassTypeYogaOneClassIntroOfferFree.id},
      user: ${fixtures.userAlice.id},
      ...
    }`);

    await ClassPass.destroy({id: [existingClassPass.id, newClassPass.id]});

    await ClassPassType.update({id: fixtures.classPassTypeYogaOneClassIntroOfferFree.id}, {max_number_per_customer: 1});

  });

  it('should create log in English for class pass created by customer', async () => {

    const classPassData = {
      user: fixtures.userAlice.id,
      class_pass_type: fixtures.classPassTypeYogaOneClassIntroOfferFree.id,
    };

    MockDate.set(moment.tz('2020-05-15 00:00:00', 'Europe/Copenhagen'));
    const {body: newClassPass} = await supertest(sails.hooks.http.app)
      .post('/class-passes?client=' + testClientId)
      .send(classPassData)
      .use(authorizeUserAlice())
      .expect(200);

    const logEntries = await ClassPassLog.find({});
    expect(logEntries).to.matchPattern(`[
      {
        class_pass_id: ${newClassPass.id},
        entry: 'Class pass created by the customer, valid until Sunday, June 14, 2020. 1 classes left.',
        ...
      },
    ]`);

    await ClassPass.destroy({id: newClassPass.id});

  });

  it('should create log in English for class pass created by admin', async () => {

    const classPassData = {
      user: fixtures.userAlice.id,
      class_pass_type: fixtures.classPassTypeYogaOneClassIntroOfferFree.id,
    };

    MockDate.set(moment.tz('2020-05-15 00:00:00', 'Europe/Copenhagen'));
    const {body: newClassPass} = await supertest(sails.hooks.http.app)
      .post('/class-passes?client=' + testClientId)
      .send(classPassData)
      .use(authorizeAdmin())
      .expect(200);

    const logEntries = await ClassPassLog.find({});
    expect(logEntries).to.matchPattern(`[
      {
        class_pass_id: ${newClassPass.id},
        entry: 'Class pass created by admin, valid until Sunday, June 14, 2020. 1 classes left. User: Admin Adminson (ID ${fixtures.userAdmin.id}).',
        ...
      },
    ]`);

    await ClassPass.destroy({id: newClassPass.id});

  });

  it('should create log in Danish for class pass created by customer', async () => {

    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'locale',
      value: 'da'
    }).fetch();

    const classPassData = {
      user: fixtures.userAlice.id,
      class_pass_type: fixtures.classPassTypeYogaOneClassIntroOfferFree.id,
    };

    MockDate.set(moment.tz('2020-05-15 00:00:00', 'Europe/Copenhagen'));
    const {body: newClassPass} = await supertest(sails.hooks.http.app)
      .post('/class-passes?client=' + testClientId)
      .send(classPassData)
      .use(authorizeUserAlice())
      .expect(200);

    const logEntries = await ClassPassLog.find({});
    expect(logEntries).to.matchPattern(`[
      {
        class_pass_id: ${newClassPass.id},
        entry: 'Adgangskort oprettet af kunden, gyldigt t.o.m. søndag d. 14. juni 2020. 1 klasser tilbage.',
        ...
      },
    ]`);

    await ClassPass.destroy({id: newClassPass.id});

    await ClientSettings.destroy({id: clientSettingsRow.id});

  });

  it('should create log in Danish for class pass created by admin', async () => {

    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'locale',
      value: 'da'
    }).fetch();

    const classPassData = {
      user: fixtures.userAlice.id,
      class_pass_type: fixtures.classPassTypeYogaOneClassIntroOfferFree.id,
    };

    MockDate.set(moment.tz('2020-05-15 00:00:00', 'Europe/Copenhagen'));
    const {body: newClassPass} = await supertest(sails.hooks.http.app)
      .post('/class-passes?client=' + testClientId)
      .send(classPassData)
      .use(authorizeAdmin())
      .expect(200);

    const logEntries = await ClassPassLog.find({});
    expect(logEntries).to.matchPattern(`[
      {
        class_pass_id: ${newClassPass.id},
        entry: 'Adgangskort oprettet af admin, gyldigt t.o.m. søndag d. 14. juni 2020. 1 klasser tilbage. Bruger: Admin Adminson (ID ${fixtures.userAdmin.id}).',
        ...
      },
    ]`);

    await ClassPass.destroy({id: newClassPass.id});

    await ClientSettings.destroy({id: clientSettingsRow.id});

  });

  it('should create time-based class pass and create log in English', async () => {

    const classPassData = {
      user: fixtures.userAlice.id,
      class_pass_type: fixtures.classPassTypeYogaUnlimitedOneMonth.id,
    };

    MockDate.set(moment.tz('2020-05-15 00:00:00', 'Europe/Copenhagen'));
    const {body: newClassPass} = await supertest(sails.hooks.http.app)
      .post('/class-passes?client=' + testClientId)
      .send(classPassData)
      .use(authorizeAdmin())
      .expect(200);

    expect(newClassPass).to.matchPattern(`{
      class_pass_type: ${fixtures.classPassTypeYogaUnlimitedOneMonth.id},
      user: ${fixtures.userAlice.id},
      ...
    }`);

    const logEntries = await ClassPassLog.find({});
    expect(logEntries).to.matchPattern(`[
      {
        class_pass_id: ${newClassPass.id},
        entry: 'Class pass created by admin, valid until Sunday, June 14, 2020. User: Admin Adminson (ID ${fixtures.userAdmin.id}).',
        ...
      },
    ]`);

    await ClassPass.destroy({id: newClassPass.id});

  });

  it('should create time-based class pass and create log in Danish', async () => {

    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'locale',
      value: 'da'
    }).fetch();

    const classPassData = {
      user: fixtures.userAlice.id,
      class_pass_type: fixtures.classPassTypeYogaUnlimitedOneMonth.id,
    };

    MockDate.set(moment.tz('2020-05-15 00:00:00', 'Europe/Copenhagen'));
    const {body: newClassPass} = await supertest(sails.hooks.http.app)
      .post('/class-passes?client=' + testClientId)
      .send(classPassData)
      .use(authorizeAdmin())
      .expect(200);

    expect(newClassPass).to.matchPattern(`{
      class_pass_type: ${fixtures.classPassTypeYogaUnlimitedOneMonth.id},
      user: ${fixtures.userAlice.id},
      ...
    }`);

    const logEntries = await ClassPassLog.find({});
    expect(logEntries).to.matchPattern(`[
      {
        class_pass_id: ${newClassPass.id},
        entry: 'Adgangskort oprettet af admin, gyldigt t.o.m. søndag d. 14. juni 2020. Bruger: Admin Adminson (ID ${fixtures.userAdmin.id}).',
        ...
      },
    ]`);

    await ClassPass.destroy({id: newClassPass.id});

    await ClientSettings.destroy({id: clientSettingsRow.id});

  });

});
