const moment = require('moment-timezone');

module.exports = {

  friendlyName: 'Populate membership_pause_length',

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

    if (typeof inputs.memberships[0].membership_pause_length !== 'undefined') {
      return exits.success();
    }

    await sails.helpers.populate.memberships.currentMembershipPause(inputs.memberships);
    await sails.helpers.populate.memberships.upcomingMembershipPause(inputs.memberships);

    for (let i = 0; i < inputs.memberships.length; i++) {

      const membership = inputs.memberships[i];

      const currentOrUpcomingMembershipPause = membership.current_membership_pause || membership.upcoming_membership_pause;

      if (!currentOrUpcomingMembershipPause) {
        membership.membership_pause_length = null;
        continue;
      }

      if (!currentOrUpcomingMembershipPause.end_date) {
        membership.membership_pause_length = null;
        continue;
      }
      const membershipPauseStartDate = moment.tz(currentOrUpcomingMembershipPause.start_date, 'Europe/Copenhagen');
      const membershipPauseEndDate = moment.tz(currentOrUpcomingMembershipPause.end_date, 'Europe/Copenhagen');

      membership.membership_pause_length = membershipPauseEndDate.diff(membershipPauseStartDate, 'days');

    }

    return exits.success();
  },
};
