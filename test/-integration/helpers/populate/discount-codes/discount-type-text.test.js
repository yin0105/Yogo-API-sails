const assert = require('assert')

describe('helpers.populate.discount-codes.valid-for-items-text.js', async () => {

  it('should return empty array if input array is empty', async () => {

    const result = await sails.helpers.populate.discountCodes.discountTypeText([])

    assert.deepStrictEqual(
      result,
      [],
    )
  })

  it('should return the input array if valid_for_items_text is already populated', async () => {

    const discountCodes = [
      {
        discount_type_text: 'Test text',
      },
      {
        discount_type_text: 'Test text 2',
      },
    ]

    const expectedResult = _.cloneDeep(discountCodes)

    const result = await sails.helpers.populate.discountCodes.discountTypeText(discountCodes)

    assert.deepStrictEqual(
      result,
      expectedResult,
    )

    assert.deepStrictEqual(
      discountCodes,
      expectedResult,
    )

  })

  it('should populate discount_type_text', async () => {

    const discountCodes = [
      {
        type: 'discount_percent',
        discount_percent: 50,
      },
      {
        type: 'discount_amount',
        discount_amount: 150,
      },
    ]

    const result = await sails.helpers.populate.discountCodes.discountTypeText(discountCodes)

    assert.deepStrictEqual(
      result,
      [
        {
          type: 'discount_percent',
          discount_percent: 50,
          discount_type_text: '50%',
        },
        {
          type: 'discount_amount',
          discount_amount: 150,
          discount_type_text: '150 kr',
        },
      ],
    )

  })

})
