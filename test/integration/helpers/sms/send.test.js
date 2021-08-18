const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID;
const fixtures = require('../../../fixtures/factory').fixtures;
const sinon = require('sinon');


const smsFakeFactory = require('../../../stubs/get-sms-transport-send-sms-spy');

describe('helpers.sms.send', async function () {

  let smsSendFake;

  before(async () => {

    // A bit dangerous, but since we fake the transport mechanism...
    sails.config.sms.sendRealSms = true;

  });

  beforeEach(() => {
    smsSendFake = smsFakeFactory.createFake();
  });

  afterEach(() => {
    sinon.restore();
  });

  after(async () => {
    sails.config.sms.sendRealSms = false;
  });

  it('should send an sms', async () => {

    const timestamp = Date.now();
    await sails.helpers.sms.send.with({
      user: fixtures.userAlice.id,
      message: 'Test message, timestamp ' + timestamp,
      type: 'class_cancelled',
    });

    expect(smsSendFake.getCall(0).args[0]).to.matchPattern({
      message: 'Test message, timestamp ' + timestamp,
      sender: 'Test client',
      msisdn: '45' + fixtures.userAlice.phone,
    });

    const [dbSms] = await Sms.find().sort('id DESC').limit(1);
    expect(dbSms).to.matchPattern(`{
      client: ${testClientId},
      user: ${fixtures.userAlice.id},
      message: 'Test message, timestamp ${timestamp}',
      type: 'class_cancelled',
      msisdn: '45${fixtures.userAlice.phone}',
      sms_provider_id: 'sms_test_id',
      sms_provider_total_cost: 0.33,
      sms_provider_currency: 'DKK',
      ...
    }`);

    await Sms.destroy({id: dbSms.id});

  });

  it('should accept user as an object with client id/object in three different formats', async () => {

    const timestamp = Date.now();
    await sails.helpers.sms.send.with({
      user: fixtures.userAlice,
      message: 'Test message, timestamp ' + timestamp,
      type: 'class_cancelled',
    });

    expect(smsSendFake.getCall(0).args[0]).to.matchPattern({
      message: 'Test message, timestamp ' + timestamp,
      sender: 'Test client',
      msisdn: '45' + fixtures.userAlice.phone,
    });

    const timestamp2 = Date.now();
    const user = _.assign(_.cloneDeep(fixtures.userAlice), {client: undefined, client_id: testClientId});
    await sails.helpers.sms.send.with({
      user: user,
      message: 'Test message, timestamp ' + timestamp2,
      type: 'class_cancelled',
    });

    expect(smsSendFake.getCall(1).args[0]).to.matchPattern({
      message: 'Test message, timestamp ' + timestamp2,
      sender: 'Test client',
      msisdn: '45' + fixtures.userAlice.phone,
    });

    const timestamp3 = Date.now();
    const user3 = _.assign(_.cloneDeep(fixtures.userAlice), {client: {id: testClientId}});
    await sails.helpers.sms.send.with({
      user: user3,
      message: 'Test message, timestamp ' + timestamp3,
      type: 'class_cancelled',
    });

    expect(smsSendFake.getCall(2).args[0]).to.matchPattern({
      message: 'Test message, timestamp ' + timestamp3,
      sender: 'Test client',
      msisdn: '45' + fixtures.userAlice.phone,
    });

    await Sms.destroy({});

  });

  it('should accept when sending fails', async () => {

    sinon.restore();
    smsSendFake = smsFakeFactory.createErrorFake();

    const timestamp = Date.now();
    await sails.helpers.sms.send.with({
      user: fixtures.userAlice,
      message: 'Test message, timestamp ' + timestamp,
      type: 'class_cancelled',
    });

    expect(smsSendFake.getCall(0).args[0]).to.matchPattern({
      message: 'Test message, timestamp ' + timestamp,
      sender: 'Test client',
      msisdn: '45' + fixtures.userAlice.phone,
    });

    const [dbSms] = await Sms.find().sort('id DESC').limit(1);
    expect(dbSms).to.matchPattern(`{
      client: ${testClientId},
      user: ${fixtures.userAlice.id},
      message: 'Test message, timestamp ${timestamp}',
      type: 'class_cancelled',
      msisdn: '45${fixtures.userAlice.phone}',
      sms_provider_id: '',
      sms_provider_total_cost: 0,
      sms_provider_currency: '',
      ...
    }`);

    await Sms.destroy({id: dbSms.id});

  });

  it('should spot malformed phone number and not send the sms', async () => {

    await Sms.destroy({});

    const oldPhone = fixtures.userAlice.phone;
    fixtures.userAlice.phone = '1234567';

    const timestamp = Date.now();
    await sails.helpers.sms.send.with({
      user: fixtures.userAlice,
      message: 'Test message, timestamp ' + timestamp,
      type: 'class_cancelled',
    });

    fixtures.userAlice.phone = oldPhone;
    expect(smsSendFake.callCount).to.equal(0);

    const dbSmss = await Sms.find().sort('id DESC').limit(1);
    expect(dbSmss.length).to.equal(0);

  });

});
