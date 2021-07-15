const knex = require('../../../objection-models/knex-config')

module.exports = {

  friendlyName: 'Populate MembershipType.membershipCount',

  inputs: {
    membershipTypes: {
      type: 'ref',
      description: 'The membership types to populate',
      required: true,
    },
  },

  fn: async function (inputs, exits) {

    // No time slots?
    if (!inputs.membershipTypes.length) {
      return exits.success([])
    }

    // Already populated?
    if (typeof inputs.membershipTypes[0].membershipCount !== 'undefined') {
      return exits.success(inputs.membershipTypes)
    }

    // Are memberships populated? If so, just count them.
    if (_.isArray(inputs.membershipTypes[0].memberships)) {
      _.each(inputs.membershipTypes, membershipType => {
        membershipType.membershipCount = membershipType.memberships.length
      })
    } else {
      // If not, query DB
      const membershipTypeIds = _.map(inputs.membershipTypes, 'id')
      const membershipCounts = await knex({mt: 'membership_type'})
        .select([
          'mt.id',
          knex.raw('COUNT(m.id) AS membershipCount'),
        ])
        .where('mt.id', 'in', membershipTypeIds)
        .innerJoin({m: 'membership'}, 'mt.id', 'm.membership_type')
        .andWhere('m.archived', false)
        .andWhere('m.status','!=', 'ended')
        .groupBy('mt.id')

      _.each(inputs.membershipTypes, membershipType => {
        const row = _.find(membershipCounts, row => row.id == membershipType.id)
        membershipType.membershipCount = row ? row.membershipCount : 0
      })
    }

    return exits.success(inputs.membershipTypes)

  },
}
