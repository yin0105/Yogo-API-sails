const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID;
const fixtures = require('../../../fixtures/factory').fixtures;

const supertest = require('supertest');
const {authorizeUserAlice, authorizeAdmin} = require('../../../utils/request-helpers');

const MockDate = require('mockdate');
const moment = require('moment-timezone');

describe('controllers.ClassPasses.update', async function () {

  let classPass;

  beforeEach(async () => {
    classPass = await ClassPass.create({
      client: testClientId,
      class_pass_type: fixtures.classPassTypeYogaUnlimitedOneMonth.id,
      user: fixtures.userAlice.id,
      start_date: '2020-04-15',
      valid_until: '2020-05-15',
    }).fetch();
    await ClassPassLog.destroy({});
  });

  afterEach(async () => {
    await ClassPass.destroy({id: classPass.id});
    await ClassPassLog.destroy({});
  });

  it('should throw forbidden if user is not admin', async () => {

    await supertest(sails.hooks.http.app)
      .put(`/class-passes/${classPass.id}?client=${testClientId}`)
      .send({
        valid_until: '2020-05-20',
      })
      .use(authorizeUserAlice())
      .expect(403);

  });

  it('should throw forbidden if class pass is on another client', async () => {

    const classPassOnOtherClient = await ClassPass.create({
      client: testClientId + 1,
      class_pass_type: fixtures.classPassTypeYogaUnlimitedOneMonth.id,
      user: fixtures.userAlice.id,
      valid_until: '2020-05-15',
    }).fetch();

    await supertest(sails.hooks.http.app)
      .put(`/class-passes/${classPassOnOtherClient.id}?client=${testClientId}`)
      .send({
        valid_until: '2020-05-20',
      })
      .use(authorizeAdmin())
      .expect(403);

  });

  it('should update time-based class pass and create log entry in English', async () => {
    await supertest(sails.hooks.http.app)
      .put(`/class-passes/${classPass.id}?client=${testClientId}`)
      .send({
        valid_until: '2020-05-20',
      })
      .use(authorizeAdmin())
      .expect(200);

    const updatedClassPass = (await ClassPass.findOne(classPass.id)).toJSON();
    expect(updatedClassPass).to.matchPattern(`{
      valid_until: '2020-05-20',
      ...      
    }`);

    const logEntries = await ClassPassLog.find({});
    expect(logEntries).to.matchPattern(`[{
      class_pass_id: ${classPass.id},
      entry: 'Class pass changed by admin. Previously valid until Friday, May 15, 2020. Now valid until Wednesday, May 20, 2020. User: Admin Adminson (ID ${fixtures.userAdmin.id}).',
      ...
    }]`);

  });

  it('should update time-based class pass and create log entry in Danish', async () => {

    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'locale',
      value: 'da'
    }).fetch();

    await supertest(sails.hooks.http.app)
      .put(`/class-passes/${classPass.id}?client=${testClientId}`)
      .send({
        valid_until: '2020-05-20',
      })
      .use(authorizeAdmin())
      .expect(200);

    const updatedClassPass = (await ClassPass.findOne(classPass.id)).toJSON();
    expect(updatedClassPass).to.matchPattern(`{
      valid_until: '2020-05-20',
      ...      
    }`);

    const logEntries = await ClassPassLog.find({});
    expect(logEntries).to.matchPattern(`[{
      class_pass_id: ${classPass.id},
      entry: 'Adgangskort ændret via admin. Tidligere gyldigt t.o.m. fredag d. 15. maj 2020. Nu gyldigt t.o.m. onsdag d. 20. maj 2020. Bruger: Admin Adminson (ID ${fixtures.userAdmin.id}).',
      ...
    }]`);

    await ClientSettings.destroy({id: clientSettingsRow.id});

  });

  it('should update fixed-count class pass and create log entry in English', async () => {

    await ClassPass.update({id: classPass.id}, {
      class_pass_type: fixtures.classPassTypeYogaTenClasses.id,
      classes_left: 5,
    });

    await supertest(sails.hooks.http.app)
      .put(`/class-passes/${classPass.id}?client=${testClientId}`)
      .send({
        valid_until: '2020-05-20',
        classes_left: 8,
      })
      .use(authorizeAdmin())
      .expect(200);

    const updatedClassPass = (await ClassPass.findOne(classPass.id)).toJSON();
    expect(updatedClassPass).to.matchPattern(`{
      valid_until: '2020-05-20',
      classes_left: 8,
      ...      
    }`);

    const logEntries = await ClassPassLog.find({});
    expect(logEntries).to.matchPattern(`[{
      class_pass_id: ${classPass.id},
      entry: 'Class pass changed by admin. Previously valid until Friday, May 15, 2020, 5 classes left. Now valid until Wednesday, May 20, 2020, 8 classes left. User: Admin Adminson (ID ${fixtures.userAdmin.id}).',
      ...
    }]`);

  });

  it('should update fixed-count class pass and create log entry in Danish', async () => {

    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'locale',
      value: 'da'
    }).fetch();

    await ClassPass.update({id: classPass.id}, {
      class_pass_type: fixtures.classPassTypeYogaTenClasses.id,
      classes_left: 5,
    });

    await supertest(sails.hooks.http.app)
      .put(`/class-passes/${classPass.id}?client=${testClientId}`)
      .send({
        valid_until: '2020-05-20',
        classes_left: 8,
      })
      .use(authorizeAdmin())
      .expect(200);

    const updatedClassPass = (await ClassPass.findOne(classPass.id)).toJSON();
    expect(updatedClassPass).to.matchPattern(`{
      valid_until: '2020-05-20',
      classes_left: 8,
      ...      
    }`);

    const logEntries = await ClassPassLog.find({});
    expect(logEntries).to.matchPattern(`[{
      class_pass_id: ${classPass.id},
      entry: 'Adgangskort ændret via admin. Tidligere gyldigt t.o.m. fredag d. 15. maj 2020 med 5 klasser tilbage. Nu gyldigt t.o.m. onsdag d. 20. maj 2020 med 8 klasser tilbage. Bruger: Admin Adminson (ID ${fixtures.userAdmin.id}).',
      ...
    }]`);

    await ClientSettings.destroy({id: clientSettingsRow.id});

  });


});
