const moment = require('moment-timezone');

module.exports = {
  friendlyName: 'Populate current_or_upcoming_membership_pause',

  description: 'Also populates derived properties current_membership_pause and upcoming_membership_pause',

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

    if (typeof inputs.memberships[0].current_or_upcoming_membership_pause !== 'undefined') {
      return exits.success()
    }

    await sails.helpers.populate.hasManyRelation(inputs.memberships, 'membership_pauses', 'MembershipPause', 'membership_id');

    const todayIsoDate = moment.tz('Europe/Copenhagen').format('YYYY-MM-DD');
    for (let i = 0; i < inputs.memberships.length; i++) {

      const membership = inputs.memberships[i];

      if (!membership.membership_pauses.length) {
        membership.current_or_upcoming_membership_pause = null;
        membership.current_membership_pause = null;
        membership.upcoming_membership_pause = null;
        continue;
      }

      const sortedMembershipPauses = _.sortBy(membership.membership_pauses, 'start_date');

      const lastMembershipPause = sortedMembershipPauses[sortedMembershipPauses.length - 1];
      if (
        lastMembershipPause.end_date && lastMembershipPause.end_date <= todayIsoDate
      ) {
        membership.current_or_upcoming_membership_pause = null;
        membership.current_membership_pause = null;
        membership.upcoming_membership_pause = null;
        continue;
      }

      membership.current_or_upcoming_membership_pause = lastMembershipPause;

      if (lastMembershipPause.start_date <= todayIsoDate) {
        membership.current_membership_pause = lastMembershipPause;
        membership.upcoming_membership_pause = null;
      } else {
        membership.upcoming_membership_pause = lastMembershipPause;
        membership.current_membership_pause = null;
      }


    }

    return exits.success()
  },
}
