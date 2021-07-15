const assert = require('assert')
const assertAsyncThrows = require('../../../utils/assert-async-throws')

describe('helpers.memberships.fetch-membership-payment', async () => {

  it('should return discounted price for a percent discount', async () => {

    const discountedPrice = await sails.helpers.discountCodes.getItemPriceWithDiscountCodeApplied(
      100,
      {
        name: 'test_discount_code',
        type: 'discount_percent',
        discount_percent: 25,
      },
    )

    assert.strictEqual(
      discountedPrice,
      75,
    )

  })

  it('should return discounted price for a amount discount', async () => {

    const discountedPrice = await sails.helpers.discountCodes.getItemPriceWithDiscountCodeApplied(
      300,
      {
        name: 'test_discount_code',
        type: 'discount_amount',
        discount_amount: 49.25,
      },
    )

    assert.strictEqual(
      discountedPrice,
      250.75,
    )

  })

  it('should throw if discount type is unknown', async () => {

    assertAsyncThrows(async () => {
        await sails.helpers.discountCodes.getItemPriceWithDiscountCodeApplied(
          300,
          {
            name: 'test_discount_code',
            type: 'discount_invalid',
            discount_amount: 49.25,
          },
        )
      },
      {
        message: 'Discount type discount_invalid not implemented yet',
      },
    )

  })

})
