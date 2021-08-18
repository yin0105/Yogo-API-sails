const fixtures = require('../../../../fixtures/factory').fixtures
const assert = require('assert')

const testClientId = require('../../../../global-test-variables').TEST_CLIENT_ID

describe('helpers.populate.class-pass-types.max-number-per-user-already-used', async function () {

  it('should return an empty array if input array is empty', async () => {

    const result = await sails.helpers.populate.classPassTypes.maxNumberPerCustomerAlreadyUsed([])

    assert.deepStrictEqual(
      result,
      [],
    )
  })

  it('should return the input array unchanged if max_number_per_customer_already_used is already populated', async () => {

    const classPassTypes = [
      {
        max_number_per_customer_already_used: true,
      },
      {
        max_number_per_customer_already_used: false,
      },
    ]

    const expectedResult = _.cloneDeep(classPassTypes)

    const result = await sails.helpers.populate.classPassTypes.maxNumberPerCustomerAlreadyUsed(classPassTypes, fixtures.userAlice)

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

    const result = await sails.helpers.populate.classPassTypes.maxNumberPerCustomerAlreadyUsed([
      {},
      {},
    ])

    assert.deepStrictEqual(
      result,
      [
        {max_number_per_customer_already_used: null},
        {max_number_per_customer_already_used: null},
      ],
    )
  })

  it('should populate max_number_per_customer_already_used', async () => {

    const classPasses = await ClassPass.createEach(
      [
        {
          client: testClientId,
          user: fixtures.userAlice.id,
          class_pass_type: fixtures.classPassTypeYogaOneClassIntroOffer.id,
        },
        {
          client: testClientId,
          user: fixtures.userAlice.id,
          class_pass_type: fixtures.classPassTypeYogaOneClassIntroOfferThreePerCustomer.id,
        },
      ],
    ).fetch()

    const classPassTypes = _.cloneDeep([
      fixtures.classPassTypeYogaOneClassIntroOffer,
      fixtures.classPassTypeYogaOneClassIntroOfferThreePerCustomer,
      fixtures.classPassTypeYogaTenClasses,
    ])

    await sails.helpers.populate.classPassTypes.maxNumberPerCustomerAlreadyUsed(classPassTypes, fixtures.userAlice)

    expect(classPassTypes).to.matchPattern(`
      [
        {
          max_number_per_customer_already_used: true,
          ...
        },
        {
          max_number_per_customer_already_used: false,
          ...
        },
        {
          max_number_per_customer_already_used: false,
          ...
        },
      ]`,
    )

    await ClassPass.destroy({id: _.map(classPasses, 'id')})

  })

})
