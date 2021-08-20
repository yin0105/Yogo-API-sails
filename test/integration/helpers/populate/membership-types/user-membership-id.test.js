const fixtures = require('../../../../fixtures/factory').fixtures
const assert = require('assert')

const testClientId = require('../../../../global-test-variables').TEST_CLIENT_ID

describe('helpers.populate.membership-types.user-membership-id', async function () {

  it('should return an empty array if input array is empty', async () => {

    const result = await sails.helpers.populate.membershipTypes.userMembershipId([], fixtures.userAlice)

    assert.deepStrictEqual(
      result,
      [],
    )
  })

  it('should return the input array unchanged if user_membership_id is already populated', async () => {

    const membershipTypes = [
      {
        user_membership_id: null,
      },
      {
        user_membership_id: 27,
      },
    ]

    const expectedResult = _.cloneDeep(membershipTypes)

    const result = await sails.helpers.populate.membershipTypes.userMembershipId(membershipTypes, fixtures.userAlice)

    assert.deepStrictEqual(
      result,
      expectedResult,
    )

    assert.deepStrictEqual(
      membershipTypes,
      expectedResult,
    )
  })

  it('should return null on all membership types if user is not specified', async () => {

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
        {
          client: testClientId,
          user: fixtures.userAlice.id,
          membership_type: fixtures.membershipTypeDance.id,
          status: 'active',
          archived: true
        },
      ],
    ).fetch()

    const membershipTypes = _.cloneDeep([
      fixtures.membershipTypeYogaUnlimited,
      fixtures.membershipTypeYogaTwoClassesPerWeek,
      fixtures.membershipTypeDance,
    ])

    await sails.helpers.populate.membershipTypes.userMembershipId(membershipTypes)

    expect(membershipTypes).to.matchPattern(`
      [
        {
          user_membership_id: null,
          ...
        },
        {
          user_membership_id: null,
          ...
        },
        {
          user_membership_id: null,
          ...
        },
      ]`,
    )

    await Membership.destroy({id: _.map(memberships, 'id')})

  })

  it('should populate user_membership_id', async () => {

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
        {
          client: testClientId,
          user: fixtures.userAlice.id,
          membership_type: fixtures.membershipTypeDance.id,
          status: 'active',
          archived: true
        },
      ],
    ).fetch()

    const membershipTypes = _.cloneDeep([
      fixtures.membershipTypeYogaUnlimited,
      fixtures.membershipTypeYogaTwoClassesPerWeek,
      fixtures.membershipTypeDance,
    ])

    await sails.helpers.populate.membershipTypes.userMembershipId(membershipTypes, fixtures.userAlice)

    expect(membershipTypes).to.matchPattern(`
      [
        {
          user_membership_id: ${memberships[0].id},
          ...
        },
        {
          user_membership_id: ${memberships[1].id},
          ...
        },
        {
          user_membership_id: null,
          ...
        },
      ]`,
    )

    await Membership.destroy({id: _.map(memberships, 'id')})

  })

})
