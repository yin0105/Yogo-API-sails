const assert = require('assert')

const assertAsyncThrows = require('../../../../utils/assert-async-throws')

const argv = require('minimist')(process.argv.slice(1))

if (argv.config_external_connection_modules) {

  describe('helpers.payment-provider.dibs.api-request', async () => {

    it('should throw an error if production payments are not allowed', async () => {

      await assertAsyncThrows(
        async () => {
          await sails.helpers.paymentProvider.dibs.apiRequest({
            merchant: 0
          })
        },
        {message: 'Aborting call to Dibs API. Production payments not allowed in this environment. Request body: {"merchant":0}'}
      )

    })

    it('should return DECLINED for a random request', async () => {

      sails.config.productionPayments = true

      const response = await sails.helpers.paymentProvider.dibs.apiRequest({
        merchant: 0,
        amount: 45000,
        currency: 208,
        orderid: 'XXXXXXXX',
        textreply: 'true',
        ticket: '55557777',
      })

      assert.deepStrictEqual(
        response,
        {
          status: 'DECLINED',
          reason: "Mock api rejected payment",
        }
      )

      sails.config.productionPayments = false


    })

    it('should throw if there is an error', async () => {

      sails.config.productionPayments = true

      const dibsTicketAuthUrl = sails.config.paymentProviders.dibs.ticketAuthUrl

      sails.config.paymentProviders.dibs.ticketAuthUrl = 'https://thispagedoesnotexist.thispagedoesnotexist'

      await assertAsyncThrows(
        async () => {
          await sails.helpers.paymentProvider.dibs.apiRequest({})
        },
        () => {
          return 'notFound'
        }
      )

      sails.config.paymentProviders.dibs.ticketAuthUrl = dibsTicketAuthUrl

      sails.config.productionPayments = true

    })

  })

}
