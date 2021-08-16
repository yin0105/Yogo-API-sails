const testClientId = require('../../../../../global-test-variables').TEST_CLIENT_ID

const fixtures = require('../../../../../fixtures/factory').fixtures

const sinon = require('sinon')

describe('helpers.payment-provider.reepay.invoice.process-if-paid', async () => {

  let
    order,
    orderItem

  async function buildOrder() {
    order = await Order.create({
      client: testClientId,
      user: fixtures.userAlice.id,
    }).fetch()

    orderItem = await OrderItem.create({
      client: testClientId,
      item_type: 'membership_type',
      item_id: fixtures.membershipTypeYogaUnlimited.id,
      payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
      count: 1,
      order: order.id,
    }).fetch()

  }

  async function destroyOrder() {
    await Order.destroy({id: order.id})
    await OrderItem.destroy({order: order.id})
  }


  before(async () => {

  })

  it('should process a payment if the matching Reepay invoice has been paid', async () => {

    await buildOrder()

    const chargeRequestFake = sinon.fake.resolves({
      state: 'settled',
      transaction: 'trans_1234567890',
      source: {
        card_type: 'visa',
        masked_card: '411111XXXXXX1111',
        exp_date: '06-24',
        recurring_payment_method: 'ca_1234567890',
      },
    })
    sinon.replace(sails.helpers.paymentProvider.reepay.api, 'request', chargeRequestFake)

    const pdfReceiptFake = sinon.fake.returns({filename: 'Test filename', pdfBuffer: Buffer.from('Test')})
    pdfReceiptFake.with = pdfReceiptFake
    sinon.replace(sails.helpers.order, 'pdfReceipt', pdfReceiptFake)

    await sails.helpers.paymentProvider.reepay.invoice.processIfPaid(order.id)

    const updatedOrder = await Order.findOne(order.id)

    expect(updatedOrder).to.matchPattern(
      `{
        paid: _.isBetween|1521205781694|3521205781694,
        pay_type: 'visa',
        card_prefix: '411111',
        card_last_4_digits: '1111',
        card_expiration: '06/24',
        masked_card: '411111XXXXXX1111',
        ...
      }`,
    )

    await destroyOrder()

    sinon.restore()

  })

  it('should do nothing if the matching Reepay invoice has NOT been paid', async () => {

    await buildOrder()

    const chargeRequestFake = sinon.fake.resolves({
      state: 'created',
    })
    sinon.replace(sails.helpers.paymentProvider.reepay.api, 'request', chargeRequestFake)

    await sails.helpers.paymentProvider.reepay.invoice.processIfPaid(order.id)

    const updatedOrder = await Order.findOne(order.id)

    expect(updatedOrder.paid).to.equal(0)

    await destroyOrder()

    sinon.restore()

  })

  it('should process a test-payment if the matching Reepay invoice has been paid', async () => {

    order = await Order.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      test: 1,
      payment_provider_order_id: '3_test1234567890',
    }).fetch()

    orderItem = await OrderItem.create({
      client: testClientId,
      item_type: 'membership_type',
      item_id: fixtures.membershipTypeYogaUnlimited.id,
      payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
      count: 1,
      order: order.id,
    }).fetch()

    const chargeRequestFake = sinon.fake.resolves({
      state: 'settled',
      transaction: 'trans_1234567890',
      source: {
        card_type: 'visa',
        masked_card: '411111XXXXXX1111',
        exp_date: '06-24',
        recurring_payment_method: 'ca_1234567890',
      },
    })
    sinon.replace(sails.helpers.paymentProvider.reepay.api, 'request', chargeRequestFake)

    const pdfReceiptFake = sinon.fake.returns({filename: 'Test filename', pdfBuffer: Buffer.from('Test')})
    pdfReceiptFake.with = pdfReceiptFake
    sinon.replace(sails.helpers.order, 'pdfReceipt', pdfReceiptFake)

    await sails.helpers.paymentProvider.reepay.invoice.processIfPaid('3_test1234567890')

    expect(chargeRequestFake.firstCall.args[2]).to.equal('/charge/3_test1234567890')

    const updatedOrder = await Order.findOne(order.id)

    expect(updatedOrder).to.matchPattern(
      `{
        paid: _.isBetween|1521205781694|3521205781694,
        pay_type: 'visa',
        card_prefix: '411111',
        card_last_4_digits: '1111',
        card_expiration: '06/24',
        masked_card: '411111XXXXXX1111',
        ...
      }`,
    )

    await destroyOrder()

    sinon.restore()

  })

})
