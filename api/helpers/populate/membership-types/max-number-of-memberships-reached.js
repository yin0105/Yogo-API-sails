module.exports = {

  friendlyName: 'Populate MembershipType.max_number_of_memberships_reached',

  inputs: {
    membershipTypes: {
      type: 'ref',
      description: 'The membership types to populate',
      required: true,
    },
  },

  fn: async function (inputs, exits) {

    if (!inputs.membershipTypes.length) {
      return exits.success([])
    }

    if (typeof inputs.membershipTypes[0].max_number_of_memberships_reached !== 'undefined') {
      return exits.success(inputs.membershipTypes)
    }

    await sails.helpers.populate.membershipTypes.membershipCount(inputs.membershipTypes)

    _.each(inputs.membershipTypes, membershipType => {
      if (!membershipType.has_max_number_of_memberships) {
        membershipType.max_number_of_memberships_reached = false
        return
      }
      membershipType.max_number_of_memberships_reached = membershipType.membershipCount >= membershipType.max_number_of_memberships
    })

    return exits.success(inputs.membershipTypes)

  },
}
