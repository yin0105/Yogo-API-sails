const knex = require('../../../objection-models/knex-config')

module.exports = {

  friendlyName: 'Populate MembershipTypePaymentOption.membershipCount',

  inputs: {
    membershipTypePaymentOptions: {
      type: 'ref',
      description: 'The payment options to populate',
      required: true,
    },
  },

  fn: async function (inputs, exits) {

    // No time slots?
    if (!inputs.membershipTypePaymentOptions.length) {
      return exits.success([])
    }

    // Already populated?
    if (typeof inputs.membershipTypePaymentOptions[0].membershipCount !== 'undefined') {
      return exits.success(inputs.membershipTypePaymentOptions)
    }

    // Are memberships populated? If so, just count them.
    if (_.isArray(inputs.membershipTypePaymentOptions[0].memberships)) {
      _.each(inputs.membershipTypePaymentOptions, membershipTypePaymentOption => {
        membershipTypePaymentOption.membershipCount = membershipTypePaymentOption.memberships.length
      })
    } else {
      // If not, query DB
      const membershipTypePaymentOptionIds = _.map(inputs.membershipTypePaymentOptions, 'id')

      const membershipCounts = await knex({mtpo: 'membership_type_payment_option'})
        .select([
          'mtpo.id',
          knex.raw('COUNT(m.id) AS membershipCount'),
        ])
        .where('mtpo.id', 'in', membershipTypePaymentOptionIds)
        .innerJoin({m: 'membership'}, 'mtpo.id', 'm.payment_option')
        .andWhere('m.archived', false)
        .andWhere('m.status', 'in', ['active', 'cancelled_running'])
        .groupBy('mtpo.id')

      _.each(inputs.membershipTypePaymentOptions, membershipTypePaymentOption => {
        const row = _.find(membershipCounts, row => row.id == membershipTypePaymentOption.id)
        membershipTypePaymentOption.membershipCount = row ? row.membershipCount : 0
      })
    }

    return exits.success(inputs.membershipTypePaymentOptions)

  },
}
