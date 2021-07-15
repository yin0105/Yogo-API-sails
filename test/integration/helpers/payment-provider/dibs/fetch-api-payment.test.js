const sinon = require('sinon')
const testClientId = require('../../../../global-test-variables').TEST_CLIENT_ID
const fixtures = require('../../../../fixtures/factory').fixtures
const assert = require('assert')
const comparePartialObject = require('../../../../utils/compare-partial-object')

const assertAsyncThrows = require('../../../../utils/assert-async-throws')

var requestErrors = require('request-promise-native/errors')

const apiRequestFakeFactory = require('../../../../fakes/default-api-request-fake')

describe('helpers.payment-provider.dibs.fetch-api-payment', async () => {

  let
    order,
    orderItems,
    paymentSubscription

  before(async () => {
    order = await Order.create({
      total: 450,
      client: testClientId,
      user: fixtures.userAlice.id,
    }).fetch()

    orderItems = await OrderItem.createEach(
      [
        {
          order: order.id,
          name: 'Membership renewal',
        },
      ],
    ).fetch()

    paymentSubscription = await PaymentSubscription.create({
      payment_provider_subscription_id: 'qwerty',
    }).fetch()

    sinon.restore()
  })

  after(async () => {
    await Order.destroy({id: order.id})
    await OrderItem.destroy({id: _.map(orderItems, 'id')})
    await PaymentSubscription.destroy({id: paymentSubscription.id})
  })

  it('should create a subscription transaction and fetch payment', async () => {

    apiRequestFakeFactory.replace()

    const paymentResult = await sails.helpers.paymentProvider.dibs.fetchApiPayment(order, paymentSubscription)

    assert(paymentResult, true)

    const createdPaymentSubscriptionTransaction = await PaymentSubscriptionTransaction.find()

    comparePartialObject(
      createdPaymentSubscriptionTransaction,
      [
        {
          payment_subscription: paymentSubscription.id,
          client: testClientId,
          amount: 450,
          status: 'accepted',
          transaction_id: 123456,
          approvalcode: 39,
          comment: '',
        },
      ],
    )

    await PaymentSubscriptionTransaction.destroy({})

    sinon.restore()

  })

  it('should create a subscription transaction and record if payment fails', async () => {

    apiRequestFakeFactory.replace({status: 'DECLINED'})

    const paymentResult = await sails.helpers.paymentProvider.dibs.fetchApiPayment(order, paymentSubscription)

    assert(paymentResult, false)

    const createdPaymentSubscriptionTransaction = await PaymentSubscriptionTransaction.find()

    comparePartialObject(
      createdPaymentSubscriptionTransaction,
      [
        {
          payment_subscription: paymentSubscription.id,
          client: testClientId,
          amount: 450,
          status: 'failed',
          comment: 'Test reason',
        },
      ],
    )

    await PaymentSubscriptionTransaction.destroy({})

    sinon.restore()

  })

  it('should log and throw an error if request fails', async () => { // For more info, see https://www.npmjs.com/package/request-promise

    const dibsApiRequestFakeThrows = sinon.fake.throws(new Error('Timeout'))

    sinon.replace(sails.helpers.paymentProvider.dibs, 'apiRequest', dibsApiRequestFakeThrows)

    await assertAsyncThrows(
      async () => {
        await sails.helpers.paymentProvider.dibs.fetchApiPayment(order, paymentSubscription)
      },
      {
        message: "Timeout"
      },
    )

    const createdPaymentSubscriptionTransaction = await PaymentSubscriptionTransaction.find()

    comparePartialObject(
      createdPaymentSubscriptionTransaction,
      [
        {
          payment_subscription: paymentSubscription.id,
          client: testClientId,
          amount: 450,
          status: 'error',
          comment: 'Timeout',
        },
      ],
    )

    const logEntry = (await CronLog.find({}).limit(1).sort('id DESC'))[0]

    comparePartialObject(
      logEntry,
      {
        entry: 'Timeout'
      }
    )

    await PaymentSubscriptionTransaction.destroy({})

  })

})
