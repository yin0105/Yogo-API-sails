const moment = require('moment-timezone')

module.exports = {

  friendlyName: 'Populate MembershipType.userIsEligibleForCampaign',

  inputs: {
    membershipTypes: {
      type: 'ref',
      description: 'The membership types to populate',
      required: true,
    },
    user: {
      type: 'ref',
      description: 'The user to populate for',
      required: false
    }
  },

  fn: async function (inputs, exits) {

    // No membership types?
    if (!inputs.membershipTypes.length) {
      return exits.success([])
    }

    // Already populated?
    if (typeof inputs.membershipTypes[0].userIsEligibleForCampaign !== 'undefined') {
      return exits.success(inputs.membershipTypes)
    }

    if (!inputs.user) {
      _.each(inputs.membershipTypes, mt => {
        mt.userIsEligibleForCampaign = false
      })
      return exits.success(inputs.membershipTypes)
    }

    const userId = sails.helpers.util.idOrObjectIdInteger(inputs.user)

    await Promise.all(_.map(inputs.membershipTypes, async membershipType => {

      if (!membershipType.active_campaign) {
        membershipType.userIsEligibleForCampaign = false
        return
      }
      if (!_.isObject(membershipType.active_campaign)) {
        membershipType.active_campaign = await MembershipCampaign.findOne(membershipType.active_campaign)
      }
      const relevantMemberships = await Membership.find({
        membership_type: membershipType.id,
        user: userId,
        archived: false
      })

      const userCouldHaveMembershipLatestAt = moment.tz('Europe/Copenhagen').subtract(membershipType.active_campaign.min_number_of_months_since_customer_last_had_membership_type, 'months')
      const membershipViolatingDeadline = _.find(
        relevantMemberships,
        potentialViolatingMembership => {
          return moment.tz(potentialViolatingMembership.paid_until, 'Europe/Copenhagen').isAfter(userCouldHaveMembershipLatestAt, 'day')
        }
      )
      membershipType.userIsEligibleForCampaign = !membershipViolatingDeadline
    }))


    return exits.success(inputs.membershipTypes)

  },
}
