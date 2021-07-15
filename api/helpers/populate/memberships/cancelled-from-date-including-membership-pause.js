module.exports = {
  friendlyName: 'Populate cancelled_from_date_including_membership_pause',

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

    if (typeof inputs.memberships[0].cancelled_from_date_including_membership_pause !== 'undefined') {
      return exits.success();
    }

    await sails.helpers.memberships.checkForEndedPausesAndPushDates(inputs.memberships);

    await sails.helpers.populate.memberships.currentOrUpcomingMembershipPause(inputs.memberships);
    await sails.helpers.populate.memberships.membershipPauseLength(inputs.memberships);


    await Promise.all(_.map(inputs.memberships, async membership => {

      if (membership.status !== 'cancelled_running') {
        membership.cancelled_from_date_including_membership_pause = null;
        return;
      }

      const cancelledFromDateMoment = sails.helpers.util.normalizeDate(membership.cancelled_from_date);

      if (!membership.current_or_upcoming_membership_pause) {
        membership.cancelled_from_date_including_membership_pause = cancelledFromDateMoment.format('YYYY-MM-DD');
        return;
      }

      membership.cancelled_from_date_including_membership_pause =
        cancelledFromDateMoment.add(membership.membership_pause_length, 'days').format('YYYY-MM-DD');

    }));

    return exits.success();
  },
};
