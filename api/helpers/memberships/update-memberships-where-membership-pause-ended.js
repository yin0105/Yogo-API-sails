const moment = require('moment-timezone');

module.exports = {
  friendlyName: 'Start and stop membership pauses',

  inputs: {
    req: {
      type: 'ref',
      required: true,
    },
  },

  fn: async (inputs, exits) => {

    const todayIsoDate = moment.tz('Europe/Copenhagen').format('YYYY-MM-DD');

    const endedMembershipPauses = await knex({mp: 'membership_pause'})
      .innerJoin({m: 'membership'}, 'm.current_membership_pause', 'mp.id')
      .where({
        'm.archived': 0,
      })
      .andWhere('mp.end_date', '<=', todayIsoDate)
      .select(['mp.id', 'mp.membership_id']);

    const endedMembershipPausesClientIds = _.map(endedMembershipPauses, 'client_id');

    const endedMembershipPausesLocaleByClientId = await sails.helpers.clientSettings.getSettingForMultipleClients(
      endedMembershipPausesClientIds,
      'locale',
    );

    for (let i = 0; i < endedMembershipPauses; i++) {

      const expiredMembershipPause = endedMembershipPauses[i];

      const expiredMembershipPauseUpdated = await knex({m: 'membership'})
        .where({id: expiredMembershipPause.membership_id})
        .whereNotNull('current_membership_pause')
        .update({
          current_membership_pause: null,
        });

      if (expiredMembershipPauseUpdated) {
        await sails.helpers.cronLog.log(`Expired current membership pause ${expiredMembershipPause.id} from membership ${expiredMembershipPause.membership_id}`);
        const locale = endedMembershipPausesLocaleByClientId[expiredMembershipPause.client_id];
        req.i18n.setLocale(locale);
        const logEntry = await req.i18n.__('membershipLog.MembershipPauseStarted');

        await sails.helpers.membershipLog.log(
          expiredMembershipPause.membership_id,
          logEntry,
        );
      }

    }

    return exits.success();

  },
};
