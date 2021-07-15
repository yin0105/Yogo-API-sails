const assert = require('assert');

const fixtures = require('../../../fixtures/factory').fixtures;
const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID;

const assertAsyncThrows = require('../../../utils/assert-async-throws');

describe('helpers.client-settings.get-max', async () => {

  it('should throw if client settings is not integer', async () => {

    await assertAsyncThrows(
      async () => {
        await sails.helpers.clientSettings.getMax('login_greeting');
      },
      'defaultIsNotInteger',
    );

  });

  it('should return the default value if no clients have a higher setting', async () => {

    const settingsRows = await ClientSettings.createEach([
      {
        client: testClientId,
        key: 'class_signoff_deadline',
        value: 90,
      },
      {
        client: fixtures.testClient2.id,
        key: 'class_signoff_deadline',
        value: 60,
      },
    ]).fetch();

    const calculatedMax = await sails.helpers.clientSettings.getMax('class_signoff_deadline');

    assert.strictEqual(
      calculatedMax,
      120,
    );

    await ClientSettings.destroy({id: _.map(settingsRows, 'id')});

  });

  it('should return the maximum client setting if it is higher than the default value', async () => {

    const settingsRows = await ClientSettings.createEach([
      {
        client: testClientId,
        key: 'class_signoff_deadline',
        value: 90,
      },
      {
        client: fixtures.testClient2.id,
        key: 'class_signoff_deadline',
        value: 180,
      },
      {
        client: fixtures.testClient3.id,
        key: 'class_signoff_deadline',
        value: 60,
      },
    ]).fetch();

    assert.strictEqual(
      await sails.helpers.clientSettings.getMax('class_signoff_deadline'),
      180,
    );

    await ClientSettings.destroy({id: _.map(settingsRows, 'id')});

  });

});
