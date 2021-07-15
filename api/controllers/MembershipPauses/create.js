const moment = require('moment-timezone');
const MembershipObjection = require('../../objection-models/Membership');

module.exports = {
  friendlyName: 'Create membership pause',

  inputs: {
    start_date: {
      type: 'string',
      custom: d => d.match(/^\d\d\d\d-\d\d-\d\d$/),
      required: true,
    },
    end_date: {
      type: 'string',
      custom: d => d.match(/^\d\d\d\d-\d\d-\d\d$/),
      allowNull: true,
    },
    membership: {
      type: 'number',
      required: true,
    },
    fee: {
      type: 'number',
    },
    comment: {
      type: 'string',
      custom: s => s.length <= 100,
    },
  },

  exits: {
    forbidden: {
      responseType: 'forbidden',
    },
  },

  fn: async function (inputs, exits) {

    if (!await sails.helpers.can2('controller.MembershipPauses.create', this.req, inputs)) {
      return exits.forbidden();
    }

    const locale = this.req.i18n.getLocale();
    const i18n = this.req.i18n;

    if (inputs.end_date <= inputs.start_date) {
      return exits.success(
        await sails.helpers.applicationError.buildResponse(
          'MembershipPauseEndDateMustBeSameOrAfterStartDate',
          this.req,
        ),
      );
    }

    const now = moment.tz('Europe/Copenhagen');
    const todayIsoDate = now.format('YYYY-MM-DD');
    const nowIsoTime = now.format('HH:mm:ss');

    const membership = await MembershipObjection.query().findById(inputs.membership)
      .eager('membership_pauses')
      .modifyEager('membership_pauses', q => q.where({archived: false}));

    if (membership.status !== 'active') {
      return exits.success(
        await sails.helpers.applicationError.buildResponse(
          'OnlyActiveMembershipsCanBePaused',
          this.req,
        ),
      );
    }

    let fee = inputs.fee;

    /*const userContext = this.authorizedRequestContext;

    if (userContext === 'customer') {
      const {
        customer_can_pause_membership: customerCanPauseMembership,
        membership_pause_max_count_per_running_year: membershipPauseMaxCountPerRunningYear,
        customer_can_pause_membership_indefinitely: customerCanPauseMembershipIndefinitely,
        membership_pause_max_days_per_pause: membershipPauseMaxDaysPerPause,
        membership_pause_fee: membershipPauseFee,
      } = await sails.helpers.clientSettings.find(this.request.client, [
        'customer_can_pause_membership',
        'membership_pause_max_count_per_year',
        'customer_can_pause_membership_indefinitely',
        'membership_pause_max_days_per_pause',
        'membership_pause_fee',
      ]);

      fee = membershipPauseFee;

      if (!customerCanPauseMembership) {
        return exits.success(
          await sails.helpers.applicationError.buildResponse('customersCanNotPauseMemberships', this.req),
        );
      }

      if (!inputs.end_date && !customerCanPauseMembershipIndefinitely) {
        return exits.success(
          await sails.helpers.applicationError.buildResponse('customersCanNotPauseMembershipsIndefinitely', this.req),
        );
      }

      const oneDayBeforeTodayIsoDate = moment.tz(inputs.start_date, 'Europe/Copenhagen')
        .subtract(1, 'year').format('YYYY-MM-DD');

      const membershipPausesOneYearBack = _.filter(
        membership.membership_pauses,
        mp => mp.start_date > oneDayBeforeTodayIsoDate,
      );

      if (membershipPausesOneYearBack.length >= membershipPauseMaxCountPerRunningYear) {
        return exits.success(
          await sails.helpers.applicationError.buildResponse(
            'membershipNumberOfPausesLimitReached',
            this.req,
            {membershipPauseMaxCountPerRunningYear},
          ),
        );
      }

      const pauseLength = moment.tz(inputs.end_date, 'Europe/Copenhagen').diff(
        moment.tz(inputs.start_date, 'Europe/Copenhagen'),
        'days',
      );

      if (pauseLength > membershipPauseMaxDaysPerPause) {
        return exits.success(
          await sails.helpers.applicationError.buildResponse(
            'membershipPauseTooLong',
            this.req,
            {membershipPauseMaxDaysPerPause},
          ),
        );
      }

      if (inputs.start_date < todayIsoDate) {
        return exits.success(
          await sails.helpers.applicationError.buildResponse(
            'membershipPauseCanNotStartBeforeToday',
            this.req,
          ),
        );
      }

    }*/

    await sails.helpers.populate.memberships.currentMembershipPause([membership]);
    if (membership.current_membership_pause) {
      return exits.success(
        await sails.helpers.applicationError.buildResponse(
          'MembershipAlreadyPaused',
          this.req,
        ),
      );
    }

    await sails.helpers.populate.memberships.upcomingMembershipPause([membership]);
    if (membership.upcoming_membership_pause) {
      return exits.success(
        await sails.helpers.applicationError.buildResponse(
          'MembershipAlreadyHasPauseScheduled',
          this.req,
        ),
      );
    }

    if (membership.membership_pauses.length) {
      const sortedExistingMembershipPauses = _.sortBy(membership.membership_pauses, 'start_date');
      const lastMembershipPause = sortedExistingMembershipPauses.pop();
      if (!lastMembershipPause.end_date || lastMembershipPause.end_date > inputs.start_date) {
        return exits.success(
          await sails.helpers.applicationError.buildResponse(
            'MembershipPauseOverlapsWithPreviousPause',
            this.req,
          ),
        );
      }

    }

    const comment = inputs.comment ? inputs.comment.trim() : '';

    const createdMembershipPause = await MembershipPause.create({
      client_id: this.req.client.id,
      membership_id: inputs.membership,
      start_date: inputs.start_date,
      end_date: inputs.end_date,
      fee,
      comment,
    }).fetch();


    if (fee > 0) {

      const feePaymentSuccess = await sails.helpers.membershipPause.collectFee(createdMembershipPause);

      if (!feePaymentSuccess) {

        await MembershipPause.update({id: createdMembershipPause.id}, {archived: true});

        return exits.success(
          await sails.helpers.applicationError.buildResponse(
            'MembershipPauseFeeWasDeclined',
            this.req,
          ),
        );
      }
    }


    await sails.helpers.memberships.cancelFutureSignups.with({
      membership: inputs.membership,
      startDate: inputs.start_date <= todayIsoDate ? todayIsoDate : inputs.start_date,
      startTime: inputs.start_date <= todayIsoDate ? nowIsoTime : '00:00:00',
      endDate: inputs.end_date ? moment(inputs.end_date).subtract(1, 'day').format('YYYY-MM-DD') : undefined,
      userGetsRefundAfterDeadline: true, //userContext !== 'customer',
      onlyCancelSignupsWithoutAccess: false,
    });

    let logText;
    if (inputs.start_date <= todayIsoDate) {
      if (inputs.end_date) {
        logText = i18n.__('membershipLog.MembershipPausedFromDateToDate',
          sails.helpers.util.formatDate(inputs.start_date, locale),
          sails.helpers.util.formatDate(inputs.end_date, locale),
        );
      } else {
        logText = i18n.__('membershipLog.MembershipPausedFromDateIndefinitely',
          sails.helpers.util.formatDate(inputs.start_date, locale),
        );
      }
    } else {
      if (inputs.end_date) {
        logText = i18n.__('membershipLog.MembershipPauseScheduledFromDateToDate',
          sails.helpers.util.formatDate(inputs.start_date, locale),
          sails.helpers.util.formatDate(inputs.end_date, locale),
        );
      } else {
        logText = i18n.__('membershipLog.MembershipPauseScheduledFromDateIndefinitely',
          sails.helpers.util.formatDate(inputs.start_date, locale),
        );
      }
    }
    /*if (userContext === 'customer') {
      logText += ` ${i18n.__('membershipLog.PausedByCustomer')}`;
    } else if (userContext === 'teacher') {
      const teacherName = `${this.req.user.first_name} ${this.req.user.last_name}`;
      logText += ` ${i18n.__('membershipLog.PausedByTeacherWithName', [teacherName])}`;
    } else {*/
    //if (userContext !== 'customer') {
    logText += ` ${i18n.__('membershipLog.Comment')}: "${comment}".`;
    //}
    const adminName = `${this.req.user.first_name} ${this.req.user.last_name}`;
    logText += ` ${i18n.__('membershipLog.AdminUserColonName', adminName)}`;
    //}

    await sails.helpers.membershipLog.log(
      inputs.membership,
      logText,
    );

    return exits.success(createdMembershipPause);

  },
};
