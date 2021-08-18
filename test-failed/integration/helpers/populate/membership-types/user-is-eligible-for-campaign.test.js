const fixtures = require('../../../../fixtures/factory').fixtures
const assert = require('assert')

const MockDate = require('mockdate')
const moment = require('moment-timezone')

const comparePartialObject = require('../../../../utils/compare-partial-object')

describe('helpers.populate.membership-types.user-is-eligible-for-campaign', async function () {

  afterEach(async () => {
    MockDate.reset()
  })

  it('should return an empty array if input array is empty', async () => {

    const result = await sails.helpers.populate.membershipTypes.userIsEligibleForCampaign([])

    assert.deepStrictEqual(
      result,
      [],
    )
  })

  it('should return the input array unchanged if userIsEligibleForCampaign is already populated', async () => {

    const membershipTypes = [
      {
        userIsEligibleForCampaign: true,
      },
      {
        userIsEligibleForCampaign: false,
      },
    ]

    const result = await sails.helpers.populate.membershipTypes.userIsEligibleForCampaign(membershipTypes, fixtures.userAlice)

    const expectedResult = [
      {
        userIsEligibleForCampaign: true,
      },
      {
        userIsEligibleForCampaign: false,
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

  it('should populate userIsEligibleForCampaign', async () => {

    const campaign = await MembershipCampaign.create({
      name: 'Test campaign',
      number_of_months_at_reduced_price: 2,
      reduced_price: 50,
      min_number_of_months_since_customer_last_had_membership_type: 12,
    }).fetch()

    const membership = await Membership.create({
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'ended',
      paid_until: '2019-04-04',
      user: fixtures.userAlice.id,
    }).fetch()

    await MembershipType.update({id: fixtures.membershipTypeYogaUnlimited.id}, {active_campaign: campaign.id})

    let membershipTypes = _.cloneDeep([
      _.assign(fixtures.membershipTypeYogaUnlimited, {active_campaign: campaign.id}),
      fixtures.membershipTypeDance,
    ])

    MockDate.set(moment.tz('2020-04-03', 'Europe/Copenhagen'))

    await sails.helpers.populate.membershipTypes.userIsEligibleForCampaign(membershipTypes, fixtures.userAlice)

    comparePartialObject(
      membershipTypes,
      [
        {
          userIsEligibleForCampaign: false,
        },
        {
          userIsEligibleForCampaign: false,
        },
      ],
    )


    membershipTypes = _.cloneDeep([
      _.assign(fixtures.membershipTypeYogaUnlimited, {active_campaign: campaign.id}),
      fixtures.membershipTypeDance,
    ])

    MockDate.set(moment.tz('2020-04-05', 'Europe/Copenhagen'))

    await sails.helpers.populate.membershipTypes.userIsEligibleForCampaign(membershipTypes, fixtures.userAlice)

    comparePartialObject(
      membershipTypes,
      [
        {
          userIsEligibleForCampaign: true,
        },
        {
          userIsEligibleForCampaign: false,
        },
      ],
    )

    await MembershipCampaign.destroy({id: campaign.id})
    await Membership.destroy({id: membership.id})
    await MembershipType.update({id: fixtures.membershipTypeYogaUnlimited.id}, {active_campaign: null})
  })

})
