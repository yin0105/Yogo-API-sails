module.exports = {

  friendlyName: 'Populate membership_pause_affects_next_payment_date',

  inputs: {
    memberships: {
      type: 'ref',
      required: true,
    },
  },

  fn: async (inputs, exits) => {

    if (!inputs.memberships.length) {
      return exits.success([]);
    }

    if (typeof inputs.memberships[0].membership_pause_affects_next_payment_date !== 'undefined') {
      return exits.success();
    }

    await sails.helpers.populate.memberships.membershipPauseStartsDaysBeforeNextPaymentDate(inputs.memberships);

    for (let i = 0; i < inputs.memberships.length; i++) {

      const membership = inputs.memberships[i];

      membership.membership_pause_affects_next_payment_date =
        !!(
          membership.current_membership_pause
          || membership.upcoming_membership_pause
        )
        && (
          membership.membership_pause_starts_days_before_next_payment_date >= 0
        );

    }

    return exits.success();
  },
};
