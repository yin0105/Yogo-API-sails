const fixtures = require('../../../../fixtures/factory').fixtures
const assert = require('assert')

const testClientId = require('../../../../global-test-variables').TEST_CLIENT_ID

describe('helpers.populate.membership-types.user-has-membership-type', async function () {

  it('should return an empty array if input array is empty', async () => {

    const result = await sails.helpers.populate.membershipTypes.userHasMembershipType([])

    assert.deepStrictEqual(
      result,
      [],
    )
  })

  it('should return the input array unchanged if user_has_membership_type is already populated', async () => {

    const membershipTypes = [
      {
        user_has_membership_type: true,
      },
      {
        user_has_membership_type: false,
      },
    ]

    const result = await sails.helpers.populate.membershipTypes.userHasMembershipType(membershipTypes, fixtures.userAlice)

    const expectedResult = [
      {
        user_has_membership_type: true,
      },
      {
        user_has_membership_type: false,
      },
    ]

    assert.deepStrictEqual(
      result,
      expectedResult,
    )

    assert.deepStrictEqual(
      membershipTypes,
      expectedResult,
    )
  })

  it('should populate with false, if user is not specified', async () => {

    const membershipTypes = [
      {
        id: 123,
      },
      {
        id: 456,
      },
    ]

    const result = await sails.helpers.populate.membershipTypes.userHasMembershipType(membershipTypes)

    const expectedResult = [
      {
        id: 123,
        user_has_membership_type: false,
      },
      {
        id: 456,
        user_has_membership_type: false,
      },
    ]

    assert.deepStrictEqual(
      result,
      expectedResult,
    )

    assert.deepStrictEqual(
      membershipTypes,
      expectedResult,
    )

  })

  it('should populate user_has_membership_type', async () => {

    const memberships = await Membership.createEach(
      [
        {
          client: testClientId,
          user: fixtures.userAlice.id,
          membership_type: fixtures.membershipTypeYogaUnlimited.id,
          status: 'active',
        },
        {
          client: testClientId,
          user: fixtures.userAlice.id,
          membership_type: fixtures.membershipTypeYogaTwoClassesPerWeek.id,
          status: 'cancelled_running',
        },
      ],
    ).fetch()

    const membershipTypes = _.cloneDeep([
      fixtures.membershipTypeYogaTwoClassesPerWeek,
      fixtures.membershipTypeYogaUnlimited,
      fixtures.membershipTypeDance,
    ])

    await sails.helpers.populate.membershipTypes.userHasMembershipType(membershipTypes, fixtures.userAlice)

    expect(membershipTypes).to.matchPattern(`
      [
        {
          user_has_membership_type: true,
          ...
        },
        {
          user_has_membership_type: true,
          ...
        },
        {
          user_has_membership_type: false,
          ...
        },
      ]`,
    )

    await Membership.destroy({id: _.map(memberships, 'id')})

  })

})
