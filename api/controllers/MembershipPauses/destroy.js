const moment = require('moment-timezone');
const MembershipPauseObjection = require('../../../api/objection-models/MembershipPause');

module.exports = {
  friendlyName: 'Archive membership pause',

  inputs: {
    id: {
      type: 'number',
      required: true,
    },
  },

  exits: {
    forbidden: {
      responseType: 'forbidden',
    },
    notFound: {
      responseType: 'notFound',
    },
  },

  fn: async function (inputs, exits) {

    if (!await sails.helpers.can2('controller.MembershipPauses.destroy', this.req, inputs)) {
      return exits.forbidden();
    }

    const i18n = this.req.i18n;

    // const userContext = this.authorizedRequestContext;

    const membershipPause = await MembershipPauseObjection.query()
      .where({archived: 0})
      .findById(inputs.id)
      .eager('membership');

    if (!membershipPause) {
      return exits.notFound();
    }

    const allPausesForMembership = await MembershipPause.find({
      membership_id: membershipPause.membership_id,
      archived: false,
    });
    const sortedPausesForMembership = _.sortBy(allPausesForMembership, 'start_date');
    const lastMembershipPause = sortedPausesForMembership.pop();
    if (parseInt(inputs.id) !== parseInt(lastMembershipPause.id)) {
      return exits.success(
        await sails.helpers.applicationError.buildResponse('OnlyTheLastMembershipPauseCanBeRemoved', this.req),
      );
    }

    const now = moment.tz('Europe/Copenhagen');
    const todayIsoDate = now.format('YYYY-MM-DD');

    if (membershipPause.end_date && membershipPause.end_date <= todayIsoDate) {
      return exits.success(
        await sails.helpers.applicationError.buildResponse(
          'MembershipPauseHasEndedAndCanNotBeRemoved',
          this.req
        ),
      );
    }

    /*if (userContext === 'customer') {

      if (todayIsoDate >= membershipPause.start_date) {
        return exits.success(
          await sails.helpers.applicationError.buildResponse('membershipPauseStartedAndCanNotBeDeleted', this.req),
        );
      }

    }*/


    const newPaymentDateMoment = moment.tz(membershipPause.membership.paid_until, 'Europe/Copenhagen').add(1, 'day');
    const daysSinceNewPaymentDate = now.diff(newPaymentDateMoment, 'days');
    if (daysSinceNewPaymentDate > 28) {
      return exits.success(
        await sails.helpers.applicationError.buildResponse(
          'CantRemoveMembershipPauseBecausePaymentDateIsTooEarly',
          this.req
        ),
      );
    }

    const updatedMembershipPause = await MembershipPause.update(
      {
        id: inputs.id,
      },
      {
        archived: true,
      },
    );

    const adminUserName = `${this.req.user.first_name} ${this.req.user.last_name}`.trim();
    const logEntry = i18n.__('membershipLog.MembershipPauseRemoved') + ' ' + i18n.__('membershipLog.AdminUserColonName', adminUserName);

    await sails.helpers.membershipLog.log(
      membershipPause.membership_id,
      logEntry,
    );

    return exits.success(updatedMembershipPause);

  },
};
