const assert = require('assert')

const assertAsyncThrows = require('../../../utils/assert-async-throws')
const assertAsyncDbObject = require('../../../utils/assert-async-db-object')

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID
const fixtures = require('../../../fixtures/factory').fixtures

const MockDate = require('mockdate')
const moment = require('moment-timezone')

describe('helpers.client-settings.find', async () => {

  it('should return the requested keys if keys are an array', async () => {
    const values = await sails.helpers.clientSettings.find(testClientId, ['theme', 'theme_primary_color'])

    assert.deepStrictEqual(
      values,
      {
        theme: 'minimalistic',
        theme_primary_color: '#12169c',
      },
    )
  })


  it('should return the requested key if key is a string', async () => {
    const value = await sails.helpers.clientSettings.find(testClientId, 'theme')

    assert.deepStrictEqual(
      value,
      'minimalistic',
    )
  })


  it('should fail if requested key does not exist', async () => {

    await assertAsyncThrows(async () => {
        await sails.helpers.clientSettings.find(testClientId, 'invalid_key')
      },
      'invalidKey',
    )
  })

  it('should return user-defined values instead of defaults if available', async () => {

    const record = await ClientSettings.create({
      client: testClientId,
      key: 'customer_can_sign_up_for_class_max_days_before_class',
      value: 60,
    }).fetch()

    const value = await sails.helpers.clientSettings.find(testClientId, 'customer_can_sign_up_for_class_max_days_before_class')

    assert.deepStrictEqual(
      value,
      60,
    )

    await ClientSettings.destroy({id: record.id})
  })

})
