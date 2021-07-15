const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID;
const fixtures = require('../../../fixtures/factory').fixtures;

const supertest = require('supertest');
const {authorizeUserAlice, authorizeAdmin} = require('../../../utils/request-helpers');

const MockDate = require('mockdate');
const moment = require('moment-timezone');

describe('controllers.ClassPasses.destroy', async function () {

  let classPass;

  beforeEach(async () => {
    classPass = await ClassPass.create({
      client: testClientId,
      class_pass_type: fixtures.classPassTypeYogaUnlimitedOneMonth.id,
      user: fixtures.userAlice.id,
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
      .delete(`/class-passes/${classPass.id}?client=${testClientId}`)
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
      .delete(`/class-passes/${classPassOnOtherClient.id}?client=${testClientId}`)
      .use(authorizeAdmin())
      .expect(403);

  });

  it('should archive class pass and create log entry in English', async () => {
    await supertest(sails.hooks.http.app)
      .delete(`/class-passes/${classPass.id}?client=${testClientId}`)
      .use(authorizeAdmin())
      .expect(200);

    const logEntries = await ClassPassLog.find({});
    expect(logEntries).to.matchPattern(`[{
      class_pass_id: ${classPass.id},
      entry: 'Class pass deleted by admin. User: Admin Adminson (ID ${fixtures.userAdmin.id})',
      ...
    }]`)
  })

  it('should archive class pass and create log entry in Danish', async () => {

    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'locale',
      value: 'da'
    }).fetch();

    await supertest(sails.hooks.http.app)
      .delete(`/class-passes/${classPass.id}?client=${testClientId}`)
      .use(authorizeAdmin())
      .expect(200);

    const logEntries = await ClassPassLog.find({});
    expect(logEntries).to.matchPattern(`[{
      class_pass_id: ${classPass.id},
      entry: 'Adgangskort slettet via admin. Bruger: Admin Adminson (ID ${fixtures.userAdmin.id})',
      ...
    }]`)

    await ClientSettings.destroy({id: clientSettingsRow.id});

  })

});
