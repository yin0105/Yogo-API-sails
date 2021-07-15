module.exports = {

  friendlyName: 'Populate MembershipType.user_has_membership_type',

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
    if (typeof inputs.membershipTypes[0].user_has_membership_type !== 'undefined') {
      return exits.success(inputs.membershipTypes)
    }

    if (!inputs.user) {
      _.each(inputs.membershipTypes, mt => {
        mt.user_has_membership_type = false
      })
      return exits.success(inputs.membershipTypes)
    }

    await sails.helpers.populate.membershipTypes.userMembershipId(inputs.membershipTypes, inputs.user)

    _.each(inputs.membershipTypes, membershipType => {
      membershipType.user_has_membership_type = !!membershipType.user_membership_id
    })

    return exits.success(inputs.membershipTypes)

  },
}
