const moment = require('moment-timezone');

module.exports = {
  friendlyName: 'Populate membership short status text',

  inputs: {
    memberships: {
      type: 'ref',
      description: 'An array of memberships to populate',
      required: true,
    },
    i18n: {
      type: 'ref',
      required: true,
    },
  },

  fn: async (inputs, exits) => {

    const i18n = inputs.i18n;

    if (!inputs.memberships.length) {
      return exits.success([]);
    }

    if (typeof inputs.memberships[0].status_text !== 'undefined') {
      return exits.success();
    }

    await sails.helpers.populate.hasManyRelation(
      inputs.memberships,
      'payment_subscriptions',
      'PaymentSubscription',
      'membership',
    );

    await sails.helpers.populate.memberships.currentOrUpcomingMembershipPause(inputs.memberships);
    await sails.helpers.populate.memberships.nextPayment(inputs.memberships);
    await sails.helpers.populate.memberships.cancelledFromDateIncludingMembershipPause(inputs.memberships);

    for (let i = 0; i < inputs.memberships.length; i++) {

      const membership = inputs.memberships[i];

      if (membership.archived) {
        membership.status_text = i18n.__('membershipStatusText.Archived');
        continue;
      }

      let membershipPauseText = '';
      if (membership.current_membership_pause) {
        membershipPauseText = i18n.__('membershipStatusText.Paused');
      } else if (membership.upcoming_membership_pause) {
        membershipPauseText = i18n.__('membershipStatusText.MembershipPauseScheduled');
      }

      const todayIsoDate = moment.tz('Europe/Copenhagen').format('YYYY-MM-DD');

      switch (membership.status) {
        case 'active':
          if (!_.find(membership.payment_subscriptions, {status: 'active'})) {
            if (membership.next_payment.date && todayIsoDate >= membership.next_payment.date) {
              membership.status_text =
                membershipPauseText
                + ' '
                + i18n.__('membershipStatusText.MissingPaymentCard')
                + ' '
                + i18n.__('membershipStatusText.PaymentDue');
            } else {
              membership.status_text =
                membershipPauseText
                + ' '
                + i18n.__('membershipStatusText.MissingPaymentCard');
            }
          } else if (membership.renewal_failed) {
            membership.status_text = membershipPauseText
              + ' '
              + i18n.__n(
                'membershipStatusText.AutomaticRenewalFailedNTimes',
                membership.renewal_failed,
              );
          } else {
            membership.status_text = membershipPauseText
              ? membershipPauseText
              : i18n.__('membershipStatusText.Active');
          }
          break;

        case 'cancelled_running':
          let returnText = membershipPauseText + ' ';
          const cancelledFromDateString = sails.helpers.util.formatDate(
            membership.cancelled_from_date_including_membership_pause,
            i18n.getLocale(),
          );
          returnText += i18n.__('membershipStatusText.TerminatedFromDate', cancelledFromDateString);
          const oneDayBeforeCancellationDateIso = sails.helpers.util.normalizeDate(
            membership.cancelled_from_date_including_membership_pause,
          ).subtract(1, 'day').format('YYYY-MM-DD');

          if (
            membership.paid_until < oneDayBeforeCancellationDateIso
            && !_.find(membership.payment_subscriptions, {status: 'active'})
          ) {
            returnText += ' ' + i18n.__('membershipStatusText.MissingPaymentCard');
            if (membership.paid_until < todayIsoDate) {
              returnText += ' ' + i18n.__('membershipStatusText.PaymentDue');
            }
          }
          if (membership.renewal_failed) {
            returnText += " "
              + i18n.__n('membershipStatusText.AutomaticRenewalFailedNTimes', membership.renewal_failed);
          }
          membership.status_text = returnText;
          break;

        case 'ended':
          membership.status_text = i18n.__('membershipStatusText.Stopped');
          break;
      }

      membership.status_text = membership.status_text.trim();

    }

    return exits.success();
  },
};
