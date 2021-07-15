module.exports = {
  friendlyName: 'Populate upcoming membership pause',

  inputs: {
    memberships: {
      type: 'ref',
      required: true,
    },
  },

  fn: async (inputs, exits) => {

    if (!inputs.memberships.length) {
      return exits.success([])
    }

    if (typeof inputs.memberships[0].upcoming_membership_pause !== 'undefined') {
      return exits.success()
    }

    await sails.helpers.populate.memberships.currentOrUpcomingMembershipPause(inputs.memberships);

    return exits.success()
  },
}
