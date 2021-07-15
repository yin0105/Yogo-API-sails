module.exports = {

  friendlyName: 'Populate MembershipType.user_membership_id',

  inputs: {
    membershipTypes: {
      type: 'ref',
      description: 'The membership types to populate',
      required: true,
    },
    user: {
      type: 'ref',
      description: 'The user to populate for',
      required: false,
    },
  },

  fn: async function (inputs, exits) {

    // No membership types?
    if (!inputs.membershipTypes.length) {
      return exits.success([])
    }

    // Already populated?
    if (typeof inputs.membershipTypes[0].user_membership_id !== 'undefined') {
      return exits.success(inputs.membershipTypes)
    }

    if (!inputs.user) {
      _.each(inputs.membershipTypes, mt => {
        mt.user_membership_id = null
      })
      return exits.success(inputs.membershipTypes)
    }

    const userId = sails.helpers.util.idOrObjectIdInteger(inputs.user)

    const currentMemberships = await Membership.find({
      user: userId,
      status: ['active', 'cancelled_running'],
      archived: false,
    })

    _.each(inputs.membershipTypes, membershipType => {
      const membership = _.find(currentMemberships, {membership_type: membershipType.id})
      membershipType.user_membership_id = membership ? membership.id : null
    })

    return exits.success(inputs.membershipTypes)

  },
}
