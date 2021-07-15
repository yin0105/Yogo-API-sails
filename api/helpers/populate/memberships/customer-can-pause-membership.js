const moment = require('moment-timezone');

module.exports = {
  friendlyName: 'Populate customer_can_pause_membership',

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

    if (typeof inputs.memberships[0].customer_can_pause_membership !== 'undefined') {
      return exits.success();
    }

    await sails.helpers.populate.memberships.currentMembershipPause(inputs.memberships);
    await sails.helpers.populate.memberships.upcomingMembershipPause(inputs.memberships);

    const {
      customer_can_pause_membership: customerCanPauseMembership,
      membership_pause_max_count_per_running_year: membershipPauseMaxCountPerRunningYear,
    } = await sails.helpers.clientSettings.find(
      inputs.memberships[0].client_id || inputs.memberships[0].client,
      [
        'customer_can_pause_membership',
        'membership_pause_max_count_per_running_year',
      ],
    );

    const today = moment.tz('Europe/Copenhagen');
    for (let i = 0; i < inputs.memberships.length; i++) {

      const membership = inputs.memberships[i];
      if (!customerCanPauseMembership) {
        membership.customer_can_pause_membership = false;
        continue;
      }

      const existingMembershipPausesOneYearBack = _.filter(
        membership.membership_pauses,
        mp => today.diff(moment.tz(mp.start_date, 'Europe/Copenhagen'), 'days') < 365,
      );

      membership.customer_can_pause_membership = existingMembershipPausesOneYearBack.length < membershipPauseMaxCountPerRunningYear;

    }

    return exits.success();
  },
};
