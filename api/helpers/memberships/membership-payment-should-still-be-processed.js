const moment = require('moment-timezone');

module.exports = {

  friendlyName: 'Membership payment should still be processed',

  description: 'Called when a membership has been selected for payment processing and then locked, to verify that it was not processed by another thread between selection and locking. Also check that it should not be paused.',

  inputs: {
    membership: {
      type: 'ref',
      description: 'The membership to verify if it should still be processed for payment',
      required: true,
    },
    dbConnection: {
      type: 'ref',
      description: 'The dbConnection that is holding a lock on the membership db row',
      required: true,
    },
  },

  fn: async (inputs, exits) => {

    const cronLog = sails.helpers.cron.log;

    const membershipId = sails.helpers.util.idOrObjectIdInteger(inputs.membership);
    const membership = await Membership.findOne(membershipId).usingConnection(inputs.dbConnection);

    if (membership.archived) {
      await cronLog(`Membership ${membershipId} payment should not be processed after all. It has been archived.`);
      return exits.success(false);
    }

    if (parseInt(membership.automatic_payment_processing_started) !== 0) {
      await cronLog(`Membership ${membershipId} payment should not be processed after all. It is already being processed.`);
      return exits.success(false);
    }

    if (!_.includes(['active', 'cancelled_running'], membership.status)) {
      await cronLog(`Membership ${membershipId} payment should not be processed after all. Status is wrong.`);
      return exits.success(false);
    }

    const now = moment.tz('Europe/Copenhagen');
    const paidUntilDate = moment.tz(membership.paid_until, 'Europe/Copenhagen');

    if (membership.status === 'cancelled_running') {
      const cancelledFromDate = moment.tz(membership.cancelled_from_date, 'Europe/Copenhagen');
      if (now.isSameOrAfter(cancelledFromDate, 'day')) {
        await cronLog(`Membership ${membershipId} should not be processed. Is has been cancelled and is expired.`);
        return exits.success(false);
      }
    }

    if (parseInt(membership.renewal_failed) === 0) {
      const paidUntilDateHasPassed = now.isAfter(paidUntilDate, 'day');
      if (!paidUntilDateHasPassed) {
        await cronLog(`Membership ${membershipId} should not be processed. It is already paid for.`);
        return exits.success(false);
      }
    }

    if (parseInt(membership.renewal_failed) > 0) {
      const clientSettings = await sails.helpers.clientSettings.find(
        membership.client,
        [
          'membership_number_of_failed_payment_attempts_before_termination',
          'membership_payment_failed_days_before_attempt_2',
          'membership_payment_failed_days_before_attempt_3',
          'membership_payment_failed_days_before_attempt_4',
          'membership_payment_failed_days_before_attempt_5',
        ],
      );

      const nextRenewalAttemptIndex = parseInt(membership.renewal_failed) + 1;

      let nextRenewalAttemptDate = moment(paidUntilDate).add(1, 'day');
      for (let i = 2; i <= nextRenewalAttemptIndex; i++) {
        nextRenewalAttemptDate.add(
          clientSettings['membership_payment_failed_days_before_attempt_' + i],
          'days',
        );
      }

      if (now.isBefore(nextRenewalAttemptDate, 'day')) {
        await cronLog(`Membership ${membership.id} payment should not be processed after all. The day has not come yet.`);
        return exits.success(false);
      }

      const renewalFailedLastTime = moment.tz(membership.renewal_failed_last_time_at, 'x', 'Europe/Copenhagen');
      if (now.diff(renewalFailedLastTime, 'minutes') < 60 * 24) {
        await cronLog(`Membership ${membership.id} payment should not be processed after all. It has not been 24 hours since last try.`);
        return exits.success(false);
      }
    }

    const membershipPauseThatShouldBeApplied = await knex({mp: 'membership_pause'})
      .where({
        membership_id: membershipId,
        archived: 0,
      })
      .andWhere('start_date', '<=', now.format('YYYY-MM-DD'))
      .andWhere(function () {
        this.whereNull('end_date')
          .orWhere('end_date', '>', now.format('YYYY-MM-DD'));
      });

    if (membershipPauseThatShouldBeApplied.length) {
      await cronLog(`Membership ${membership.id} payment should not be processed after all. There is a membership pause that should be applied.`);
      return exits.success(false);
    }

    return exits.success(true);
  },

};
