const assert = require('assert')

const assertAsyncThrows = require('../../../utils/assert-async-throws')

describe('helpers.client-settings.get-default', async () => {

  it('should throw if default value is localized and no locale is specified', async () => {

    await assertAsyncThrows(
      async () => {
        await sails.helpers.clientSettings.getDefault('login_greeting')
      },
      'localeMissingForLocalizedDefault'
    )

  })

  it('should return the default value', async () => {

    assert.strictEqual(
      sails.helpers.clientSettings.getDefault('class_signoff_deadline'),
      120
    )

  })

})
