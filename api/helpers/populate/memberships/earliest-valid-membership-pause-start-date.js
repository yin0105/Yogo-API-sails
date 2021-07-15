const moment = require('moment-timezone');

module.exports = {
  friendlyName: 'Populate earliest valid membership pause start date',

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

    if (typeof inputs.memberships[0].earliest_valid_membership_pause_start_date !== 'undefined') {
      return exits.success();
    }

    await sails.helpers.populate.hasManyRelation(inputs.memberships, 'membership_pauses', 'MembershipPause', 'membership_id');
    await sails.helpers.populate.memberships.currentMembershipPause(inputs.memberships);
    await sails.helpers.populate.memberships.upcomingMembershipPause(inputs.memberships);

    for (let i = 0; i < inputs.memberships.length; i++) {

      const membership = inputs.memberships[i];

      if (!membership.membership_pauses.length) {
        membership.earliest_valid_membership_pause_start_date = moment.tz(membership.start_date, 'Europe/Copenhagen')
          .format('YYYY-MM-DD');
        continue;
      }

      if (membership.current_membership_pause || membership.upcoming_membership_pause) {
        membership.earliest_valid_membership_pause_start_date = null;
        continue;
      }

      const sortedMembershipPauses = _.sortBy(membership.membership_pauses, 'start_date');

      const lastMembershipPause = sortedMembershipPauses[sortedMembershipPauses.length - 1];

      membership.earliest_valid_membership_pause_start_date =
        moment.tz(lastMembershipPause.end_date, 'Europe/Copenhagen').format('YYYY-MM-DD');

    }

    return exits.success();
  },
};
