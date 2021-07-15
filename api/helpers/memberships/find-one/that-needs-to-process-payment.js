const knex = require('../../../services/knex');
const moment = require('moment-timezone');

module.exports = {

  friendlyName: 'That should try payment',

  description: 'Finds a membership that needs to try payment, either just because the paid period has passed or because renewal has failed before and it is time to try again',

  fn: async (inputs, exits) => {

    const todayIsoDate = moment.tz('Europe/copenhagen').format('YYYY-MM-DD');

    const membershipsThatNeedPayment = await knex({m: 'membership'})
      .where(function () {
        this
          .where(function () {
            this
              .where('status', 'active')
              .andWhere('paid_until', '<', todayIsoDate);
          })
          .orWhere(function () {
            this
              .where('status', 'cancelled_running')
              .andWhere('paid_until', '<', todayIsoDate)
              .andWhere('cancelled_from_date', '>', todayIsoDate);
          });

      })
      .andWhere('archived', 0)
      .andWhere('automatic_payment_processing_started', 0)
      .whereNull(function () {
        // Don't process payment during membership pause
        this.select('id')
          .from('membership_pause')
          .where({
            archived: 0,
          })
          .whereRaw('membership_id = m.id')
          .where('start_date', '<=', todayIsoDate)
          .andWhere(function () {
            this.whereNull('end_date')
              .orWhere('end_date', '>', todayIsoDate);
          });
      });


    const clientSettings = {};
    const today = moment().tz('Europe/Copenhagen');

    await sails.helpers.memberships.checkForEndedPausesAndPushDates(membershipsThatNeedPayment);

    for (let i = 0; i < membershipsThatNeedPayment.length; i++) {
      const membership = membershipsThatNeedPayment[i];

      if (membership.paid_until >= todayIsoDate) {
        // Paid_until might have changed because a membership pause ended.
        continue;
      }

      const clientId = membership.client;

      if (!clientSettings[clientId]) {
        clientSettings[clientId] = await sails.helpers.clientSettings.find(
          clientId,
          [
            'pause_automatic_membership_payments',
            'membership_number_of_failed_payment_attempts_before_termination',
            'membership_payment_failed_days_before_attempt_2',
            'membership_payment_failed_days_before_attempt_3',
            'membership_payment_failed_days_before_attempt_4',
            'membership_payment_failed_days_before_attempt_5',
          ],
        );
      }

      if (clientSettings[clientId].pause_automatic_membership_payments) {
        continue;
      }

      if (parseInt(membership.renewal_failed) === 0) {
        return exits.success(membership);
      }

      const renewalFailedLastTime = moment.tz(membership.renewal_failed_last_time_at, 'x', 'Europe/Copenhagen');
      const aFullDayHasPassedSinceLastPaymentAttempt = moment().diff(renewalFailedLastTime, 'minutes') >= 60 * 24;

      if (
        parseInt(membership.renewal_failed) >=
        clientSettings[clientId]['membership_number_of_failed_payment_attempts_before_termination']
        &&
        aFullDayHasPassedSinceLastPaymentAttempt
      ) {
        return exits.success(membership);
      }

      let nextAttemptDate = moment.tz(membership.paid_until, 'Europe/Copenhagen').add(1, 'day');
      const nextAttemptNumber = parseInt(membership.renewal_failed) + 1;
      for (let i = 2; i <= nextAttemptNumber; i++) {
        nextAttemptDate.add(clientSettings[clientId]['membership_payment_failed_days_before_attempt_' + i], 'days');
      }

      if (
        today.isSameOrAfter(nextAttemptDate, 'day') &&
        aFullDayHasPassedSinceLastPaymentAttempt
      ) {
        return exits.success(membership);
      }

    }

    return exits.success(false);

  },

};
