const assert = require('assert')

const assertAsyncThrows = require('../../../utils/assert-async-throws')

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID
const fixtures = require('../../../fixtures/factory').fixtures

const MockDate = require('mockdate')
const moment = require('moment-timezone')


describe('helpers.cart.calculate-discount-code-in-cart-price', async function () {

  it('should return price and vat for a discount code in a cart with discount_percent and some items including vat', async () => {

    const discountCode = await DiscountCode.create({
      name: 'halfprice',
      type: 'discount_percent',
      discount_percent: 50,
      valid_for_items: ['events', 'products', 'membership_types', 'class_pass_types'],
    }).fetch()

    const cartItems = [
      {
        item_type: 'membership_type',
        item_id: fixtures.membershipTypeYogaUnlimited.id,
        payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
      },
      {
        item_type: 'event',
        item_id: fixtures.eventWithMultipleTimeSlots.id,
      },
      {
        item_type: 'class_pass_type',
        item_id: fixtures.classPassTypeYogaTenClasses.id,
      },
      {
        item_type: 'product',
        item_id: fixtures.productYogaMat.id,
      },
      {
        item_type: 'product',
        item_id: fixtures.productYogaMat.id,
      },
      {
        item_type: 'discount_code',
        item_id: discountCode.id,
      },
    ]

    const {price, vat} = await sails.helpers.cart.calculateDiscountCodeInCartPrice(cartItems)

    const expectedPrice = (
      fixtures.yogaUnlimitedPaymentOptionMonthly.payment_amount / 2 +
      fixtures.eventWithMultipleTimeSlots.price / 2 +
      fixtures.classPassTypeYogaTenClasses.price / 2 +
      fixtures.productYogaMat.price / 2 * 2
    ) * -1

    const expectedVat = fixtures.productYogaMat.price / 5 /* Vat anount */ / 2 /* discount code */ * 2 /* number of products */ * -1 /* discount */


    expect(price).to.equal(expectedPrice)
    expect(vat).to.equal(expectedVat)

    await DiscountCode.destroy({id: discountCode.id})

  })

  it('should return price and vat for a discount code in a cart with discount_amount and items not including vat', async () => {

    const discountCode = await DiscountCode.create({
      name: '500',
      type: 'discount_amount',
      discount_amount: 500,
      valid_for_items: ['events', 'products', 'membership_types', 'class_pass_types'],
    }).fetch()

    const cartItems = [
      {
        item_type: 'membership_type',
        item_id: fixtures.membershipTypeYogaUnlimited.id,
        payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
      },
      {
        item_type: 'event',
        item_id: fixtures.eventWithMultipleTimeSlots.id,
      },
      {
        item_type: 'class_pass_type',
        item_id: fixtures.classPassTypeYogaTenClasses.id,
      },
      {
        item_type: 'product',
        item_id: fixtures.productYogaMat.id,
      },
      {
        item_type: 'product',
        item_id: fixtures.productYogaMat.id,
      },
      {
        item_type: 'discount_code',
        item_id: discountCode.id,
      },
    ]

    const {price, vat} = await sails.helpers.cart.calculateDiscountCodeInCartPrice(cartItems)
    console.log("price = ", price)
    console.log("vat = ", vat)

    expect(price).to.equal(-500)
    expect(vat).to.equal(0)

    await DiscountCode.destroy({id: discountCode.id})

  })

  it('should return price and vat for a discount code in a cart with discount_amount and items including vat', async () => {

    const discountCode = await DiscountCode.create({
      name: '500',
      type: 'discount_amount',
      discount_amount: 500,
      valid_for_items: ['events', 'products', 'membership_types', 'class_pass_types'],
    }).fetch()

    const cartItems = [
      {
        item_type: 'product',
        item_id: fixtures.productYogaMat.id,
      },
      {
        item_type: 'product',
        item_id: fixtures.productYogaMat.id,
      },
      {
        item_type: 'discount_code',
        item_id: discountCode.id,
      },
    ]

    const {price, vat} = await sails.helpers.cart.calculateDiscountCodeInCartPrice(cartItems)

    expect(price).to.equal(-440)
    expect(vat).to.equal(-88)

  })

  it('should return price and vat for a discount code in a cart with discount_amount and some items including vat', async () => {

    // This tests a cart total less than the discount code amount. The vat can not be tested if the total is higher, since the cart items are processed in a non-determined order.

    const discountCode = await DiscountCode.create({
      name: '2000',
      type: 'discount_amount',
      discount_amount: 2000,
      valid_for_items: ['events', 'products', 'membership_types', 'class_pass_types'],
    }).fetch()

    const cartItems = [
      {
        item_type: 'class_pass_type',
        item_id: fixtures.classPassTypeYogaTenClasses.id,
      },
      {
        item_type: 'product',
        item_id: fixtures.productYogaMat.id,
      },
      {
        item_type: 'discount_code',
        item_id: discountCode.id,
      },
    ]

    const {price, vat} = await sails.helpers.cart.calculateDiscountCodeInCartPrice(cartItems)

    expect(price).to.equal(-1320)
    expect(vat).to.equal(-44) // Only calculated for the discount that applies to the yoga mat.

    await DiscountCode.destroy({id: discountCode.id})

  })

  it('should not apply discount towards a membership type that has an active campaign', async () => {

    const discountCode = await DiscountCode.create({
      name: 'halfprice',
      type: 'discount_percent',
      discount_percent: 50,
      valid_for_items: ['events', 'products', 'membership_types', 'class_pass_types'],
    }).fetch()

    const cartItems = [
      {
        item_type: 'membership_type',
        item_id: fixtures.membershipTypeYogaUnlimited.id,
        membership_campaign: 123,
      },
      {
        item_type: 'product',
        item_id: fixtures.productYogaMat.id,
      },
      {
        item_type: 'discount_code',
        item_id: discountCode.id,
      },
    ]

    const {price, vat} = await sails.helpers.cart.calculateDiscountCodeInCartPrice(cartItems)

    expect(price).to.equal(-110)
    expect(vat).to.equal(-22)

    await DiscountCode.destroy({id: discountCode.id})

  })

  it('should not apply discount if discount code is not valid for items', async () => {

    const discountCode = await DiscountCode.create({
      name: 'halfprice',
      type: 'discount_percent',
      discount_percent: 50,
      valid_for_items: [],
    }).fetch()

    const cartItems = [
      {
        item_type: 'membership_type',
        item_id: fixtures.membershipTypeYogaUnlimited.id,
        payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
      },
      {
        item_type: 'event',
        item_id: fixtures.eventWithMultipleTimeSlots.id,
      },
      {
        item_type: 'class_pass_type',
        item_id: fixtures.classPassTypeYogaTenClasses.id,
      },
      {
        item_type: 'product',
        item_id: fixtures.productYogaMat.id,
      },
      {
        item_type: 'product',
        item_id: fixtures.productYogaMat.id,
      },
      {
        item_type: 'discount_code',
        item_id: discountCode.id,
      },
    ]

    const {price, vat} = await sails.helpers.cart.calculateDiscountCodeInCartPrice(cartItems)

    expect(price).to.equal(0)
    expect(vat).to.equal(0)

    await DiscountCode.destroy({id: discountCode.id})

  })

  it('should throw if there is no discount code in cart items', async () => {

    const cartItems = [
      {
        item_type: 'membership_type',
        item_id: fixtures.membershipTypeYogaUnlimited.id,
        membership_campaign: 123,
      },
      {
        item_type: 'product',
        item_id: fixtures.productYogaMat.id,
      },
    ]

    try {
      await sails.helpers.cart.calculateDiscountCodeInCartPrice(cartItems)
    } catch (e) {
      assert.strictEqual(e.message, 'No discount code in cartItems')
      return
    }
    // assert(false)

  })

})
