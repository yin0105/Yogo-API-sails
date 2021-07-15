const assert = require('assert')

describe('helpers.populate.membership-types.max-number-of-memberships-reached', async function () {

  it('should return an empty array if input array is empty', async () => {

    const result = await sails.helpers.populate.membershipTypes.maxNumberOfMembershipsReached([])

    assert.deepStrictEqual(
      result,
      [],
    )
  })

  it('should return the input array unchanged if max_number_of_memberships_reached is already populated', async () => {

    const membershipTypes = [
      {
        max_number_of_memberships_reached: true,
      },
      {
        max_number_of_memberships_reached: false,
      },
    ]

    const result = await sails.helpers.populate.membershipTypes.maxNumberOfMembershipsReached(membershipTypes)

    const expectedResult = [
      {
        max_number_of_memberships_reached: true,
      },
      {
        max_number_of_memberships_reached: false,
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

  it('should populate max_number_of_memberships_reached', async () => {

    const membershipTypes = [
      {
        has_max_number_of_memberships: false,
        membershipCount: 19,
      },
      {
        has_max_number_of_memberships: true,
        max_number_of_memberships: 20,
        membershipCount: 19,
      },
      {
        has_max_number_of_memberships: true,
        max_number_of_memberships: 20,
        membershipCount: 20,
      },
    ]

    await sails.helpers.populate.membershipTypes.maxNumberOfMembershipsReached(membershipTypes)

    assert.deepStrictEqual(
      membershipTypes,
      [
        {
          has_max_number_of_memberships: false,
          membershipCount: 19,
          max_number_of_memberships_reached: false,
        },
        {
          has_max_number_of_memberships: true,
          max_number_of_memberships: 20,
          membershipCount: 19,
          max_number_of_memberships_reached: false,
        },
        {
          has_max_number_of_memberships: true,
          max_number_of_memberships: 20,
          membershipCount: 20,
          max_number_of_memberships_reached: true,
        },
      ],
    )

  })

})
