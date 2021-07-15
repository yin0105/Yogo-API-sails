const testClientId = require('../../../../../global-test-variables').TEST_CLIENT_ID

const assert = require('assert')

describe('helpers.payment-provider.reepay.api.http-auth-header', () => {

  it('should return Reepay auth header with test credentials', async () => {

    sails.config.paymentProviders.reepay.testAccount.privateApiKey = 'priv_test_123456789'

    const authHeader = await sails.helpers.paymentProvider.reepay.api.httpAuthHeader(testClientId)

    const basicAuthString = 'Basic ' + (new Buffer('priv_test_123456789:')).toString('base64')

    assert.deepStrictEqual(
      authHeader,
      {
        authorization: basicAuthString,
      },
    )

    delete sails.config.paymentProviders.reepay.testAccount.privateApiKey

  })

  it('should return Reepay auth header with production credentials', async () => {

    sails.config.productionPayments = true

    const privateKeySettingsRecord = await ClientSettings.create({
      client: testClientId,
      key: 'payment_service_provider_reepay_private_api_key',
      value: 'priv_1234567890',
    }).fetch()

    const authHeader = await sails.helpers.paymentProvider.reepay.api.httpAuthHeader(testClientId)

    const basicAuthString = 'Basic ' + (new Buffer('priv_1234567890:')).toString('base64')

    assert.deepStrictEqual(
      authHeader,
      {
        authorization: basicAuthString,
      },
    )

    sails.config.productionPayments = false

    await ClientSettings.destroy({id: privateKeySettingsRecord.id})

  })

})
