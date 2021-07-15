const moment = require('moment-timezone');
const MembershipPauseObjection = require('../../objection-models/MembershipPause');

module.exports = {
  friendlyName: 'Check for ended membership pauses and push membership paid_until',

  inputs: {
    memberships: {
      type: 'ref',
      required: true,
    },
  },

  fn: async (inputs, exits) => {

    const memberships = _.isArray(inputs.memberships) ? inputs.memberships : [inputs.memberships];

    const membershipIds = _.map(memberships, 'id');

    const membershipPauses = await MembershipPauseObjection.query()
      .where({archived: 0})
      .andWhere('membership_id', 'in', membershipIds);

    const clientIds = _.map(membershipPauses, 'client_id');

    const localesByClientId = await sails.helpers.clientSettings.getSettingForMultipleClients(clientIds, 'locale');
    const i18n = sails.helpers.i18N.create();

    const todayIsoDate = moment.tz('Europe/Copenhagen').format('YYYY-MM-DD');

    for (let i = 0; i < memberships.length; i++) {
      const membership = memberships[i];
      const latestPauseForMembership = _.chain(membershipPauses)
        .filter({membership_id: membership.id})
        .sortBy('start_date')
        .value()
        .pop();

      if (
        latestPauseForMembership
        && latestPauseForMembership.end_date
        && latestPauseForMembership.end_date <= todayIsoDate
        && latestPauseForMembership.is_applied_to_membership_at === 0
      ) {
        const pauseLength = moment.tz(latestPauseForMembership.end_date, 'Europe/Copenhagen')
          .diff(moment.tz(latestPauseForMembership.start_date, 'Europe/Copenhagen'), 'days');
        const newPaidUntilDate = moment.tz(membership.paid_until, 'Europe/Copenhagen')
          .add(pauseLength, 'days');
        const newPaidUntilIsoDate = newPaidUntilDate.format('YYYY-MM-DD');
        const updateResult = await knex('membership_pause')
          .where({
            id: latestPauseForMembership.id,
            is_applied_to_membership_at: 0,
          })
          .update({is_applied_to_membership_at: Date.now()});

        if (updateResult) {

          const updateData = {
            paid_until: newPaidUntilIsoDate,
          };

          if (membership.status === 'cancelled_running') {
            updateData.cancelled_from_date = moment.tz(membership.cancelled_from_date, 'Europe/Copenhagen')
              .add(pauseLength, 'days')
              .format('YYYY-MM-DD');
          }

          await knex('membership')
            .where({id: membership.id})
            .update(updateData);

          const locale = localesByClientId[latestPauseForMembership.client_id];
          i18n.setLocale(locale);

          const oldPaymentDate = moment.tz(membership.paid_until, 'Europe/Copenhagen').add(1, 'day');
          const oldPaymentDateString = sails.helpers.util.formatDate(oldPaymentDate, locale);
          membership.paid_until = newPaidUntilIsoDate;
          const newPaymentDate = moment(newPaidUntilDate).add(1, 'day');
          const newPaymentDateString = sails.helpers.util.formatDate(newPaymentDate, locale);
          const logEntry = i18n.__('membershipLog.MembershipPauseEnded', oldPaymentDateString, newPaymentDateString);
          await sails.helpers.membershipLog.log(membership, logEntry);
        }

      }
    }

    return exits.success();

  },

};
