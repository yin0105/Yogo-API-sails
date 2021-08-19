const assert = require('assert')

const testClientId = require('../../../../global-test-variables').TEST_CLIENT_ID
const fixtures = require('../../../../fixtures/factory').fixtures

describe('helpers.payment-provider.order-lines', async () => {

  let order,
    orderItems,
    discountCode,
    resultPattern

  before(async () => {

    discountCode = await DiscountCode.create({
      name: 'halfprice',
      type: 'discount_percent',
      discount_percent: 50,
      valid_for_items: ['membership_types', 'products'],
    }).fetch()

    order = await Order.create({
      user: fixtures.userAlice.id,
      client: testClientId
    }).fetch()

    orderItems = await OrderItem.createEach([
      {
        name: 'Yoga Unlimited (Monthly)',
        item_type: 'membership_type',
        item_id: fixtures.membershipTypeYogaUnlimited.id,
        item_price: fixtures.yogaUnlimitedPaymentOptionMonthly.payment_amount,
        count: 1,
        total_price: fixtures.yogaUnlimitedPaymentOptionMonthly.payment_amount,
        vat_amount: 0,
        payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
        order: order.id
      },
      {
        name: 'Yoga mat',
        item_type: 'product',
        item_id: fixtures.productYogaMat.id,
        item_price: fixtures.productYogaMat.price,
        count: 1,
        total_price: fixtures.productYogaMat.price,
        vat_amount: fixtures.productYogaMat.price / 5,
        order: order.id
      },
      {
        name: 'Discount code: halfprice',
        item_type: 'discount_code',
        item_id: discountCode.id,
        item_price: (fixtures.yogaUnlimitedPaymentOptionMonthly.payment_amount + fixtures.productYogaMat.price ) / -2,
        count: 1,
        total_price: (fixtures.yogaUnlimitedPaymentOptionMonthly.payment_amount + fixtures.productYogaMat.price) / -2,
        vat_amount: fixtures.productYogaMat.price / 5 / -2,
        order: order.id
      },
    ]).fetch()



    resultPattern = `[
      {
        ordertext: 'Yoga mat',
        amount: 22000,
        vat: 0.25,
        quantity: 1,
        totalAmount: 22000,
        amount_incl_vat: true,
      },
      {
        ordertext: 'Yoga Unlimited (Monthly)',
        amount: 30000,
        vat: 0,
        quantity: 1,
        totalAmount: 30000,
        amount_incl_vat: true,
      },
      {
        ordertext: 'Discount code: halfprice',
        amount: ${(fixtures.yogaUnlimitedPaymentOptionMonthly.payment_amount + fixtures.productYogaMat.price) / -2 * 100},
        vat: _.isBetween|0.092436974|0.092436975,
        quantity: 1,
        totalAmount: ${(fixtures.yogaUnlimitedPaymentOptionMonthly.payment_amount + fixtures.productYogaMat.price) / -2 * 100},
        amount_incl_vat: true,
      },
    ]`

  })

  it('should throw if neither order nor order_items are supplied', async () => {

    try {
      await sails.helpers.paymentProvider.reepay.orderLines.with({})
    } catch (e) {
      assert.strictEqual(e.code, 'orderOrOrderItemsMustBeProvided')
      return
    }

    // assert(false)

  })

  it('should generate reepay order lines from order items', async () => {

    const orderLines = await sails.helpers.paymentProvider.reepay.orderLines.with({orderItems: orderItems})
    
    orderLines.sort((a,b) => {
      return a.ordertext > b.ordertext ? -1: 1;
    })


    expect(orderLines).to.matchPattern(resultPattern)
  })

  it('should generate reepay order lines from order', async () => {

    const orderLines = await sails.helpers.paymentProvider.reepay.orderLines(order)

    orderLines.sort((a,b) => {
      return a.ordertext > b.ordertext ? -1: 1;
    })

    expect(orderLines).to.matchPattern(resultPattern)
  })

})
