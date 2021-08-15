const fixtures = require('../../../../fixtures/factory').fixtures
const assert = require('assert')

describe('helpers.populate.class-pass-types.user-can-buy', async function () {

  it('should return an empty array if input array is empty', async () => {

    const result = await sails.helpers.populate.classPassTypes.userCanBuy([])

    assert.deepStrictEqual(
      result,
      [],
    )
  })

  it('should return the input array unchanged if user_can_buy is already populated', async () => {

    const classPassTypes = [
      {
        user_can_buy: true,
      },
      {
        user_can_buy: false,
      },
    ]

    const expectedResult = _.cloneDeep(classPassTypes)

    const result = await sails.helpers.populate.classPassTypes.userCanBuy(classPassTypes, fixtures.userAlice)

    assert.deepStrictEqual(
      result,
      expectedResult,
    )

    assert.deepStrictEqual(
      classPassTypes,
      expectedResult,
    )
  })

  it('should return null on all items, if user is not provided', async () => {

    const result = await sails.helpers.populate.classPassTypes.userCanBuy([
      {},
      {},
    ])

    assert.deepStrictEqual(
      result,
      [
        {user_can_buy: null},
        {user_can_buy: null},
      ],
    )
  })

  it('should populate user_can_buy', async () => {

    const classPassTypes = [
      {
        max_number_per_customer_already_used: true,
      },
      {
        max_number_per_customer_already_used: false,
      },
    ]

    await sails.helpers.populate.classPassTypes.userCanBuy(classPassTypes, fixtures.userAlice)

    assert.deepStrictEqual(
      classPassTypes,
      [
        {
          max_number_per_customer_already_used: true,
          user_can_buy: false,
        },
        {
          max_number_per_customer_already_used: false,
          user_can_buy: true,
        },
      ],
    )

  })

})
