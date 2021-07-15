const moment = require('moment-timezone');

module.exports = {

  friendlyName: 'Populate membership_pause_starts_days_before_next_payment_date',

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

    if (typeof inputs.memberships[0].membership_pause_starts_days_before_next_payment_date !== 'undefined') {
      return exits.success();
    }

    await sails.helpers.populate.memberships.currentOrUpcomingMembershipPause(inputs.memberships);

    for (let i = 0; i < inputs.memberships.length; i++) {

      const membership = inputs.memberships[i];

      if (!membership.current_or_upcoming_membership_pause) {
        membership.membership_pause_starts_days_before_next_payment_date = null;
        continue;
      }

      const membershipPauseStartDate = moment.tz(membership.current_or_upcoming_membership_pause.start_date, 'Europe/Copenhagen');
      const membershipOrdinaryPaymentDate = moment.tz(membership.paid_until, 'Europe/Copenhagen').add(1, 'day');
      if (membershipPauseStartDate.isAfter(membershipOrdinaryPaymentDate, 'day')) {
        membership.membership_pause_starts_days_before_next_payment_date = 0;
        continue;
      }

      membership.membership_pause_starts_days_before_next_payment_date = membershipOrdinaryPaymentDate.diff(membershipPauseStartDate, 'days');

    }

    return exits.success();
  },
};
