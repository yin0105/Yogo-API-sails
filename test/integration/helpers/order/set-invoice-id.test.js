const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID
const assert = require('assert')

describe('helpers.order.set-invoice-id', async () => {

  it('should set invoice id to 1 if there are no orders yet', async () => {

    const order = await Order.create({
      client: testClientId,
    }).fetch()

    await sails.helpers.order.setInvoiceId(order)

    const processedOrder = await Order.findOne(order.id)

    assert.strictEqual(
      processedOrder.invoice_id,
      1,
    )

    await Order.destroy({id: order.id})

  })

  it('should set invoice id on order', async () => {

    const existingOrders = await Order.createEach(
      [
        {
          client: testClientId,
          invoice_id: 2,
        },
        {
          client: testClientId,
          invoice_id: 3,
        },
        {
          client: testClientId,
          invoice_id: 5,
        },
        {
          client: testClientId,
          archived: true,
          invoice_id: 6,
        },
      ],
    ).fetch()

    const order = await Order.create({
      client: testClientId,
    }).fetch()

    await sails.helpers.order.setInvoiceId(order)

    const processedOrder = await Order.findOne(order.id)

    assert.strictEqual(
      processedOrder.invoice_id,
      6,
    )

    await Order.destroy({id: _.map(existingOrders, 'id')})
    await Order.destroy({id: order.id})

  })

})
