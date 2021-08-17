const moment = require('moment-timezone');
const currencyDkk = require('../../filters/currency_dkk');

module.exports = {
  friendlyName: 'Update membership pause',

  inputs: {
    id: {
      type: 'number',
      required: true,
    },
    start_date: {
      type: 'string',
      custom: d => d.match(/^\d\d\d\d-\d\d-\d\d$/),
    },
    end_date: {
      type: 'string',
      custom: d => d.match(/^\d\d\d\d-\d\d-\d\d$/),
      allowNull: true,
    },
    fee: {
      type: 'number',
    },
    comment: {
      type: 'string',
      custom: s => s.length < 255,
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
    if (!await sails.helpers.can2('controller.MembershipPauses.update', this.req, inputs)) {
      return exits.forbidden();
    }

    const i18n = this.req.i18n;
    const locale = this.req.i18n.getLocale();

    const userContext = this.authorizedRequestContext;

    let membershipPause = await MembershipPause.findOne({id: inputs.id, archived: false});

    if (!membershipPause) {
      return exits.notFound();
    }

    membershipPause = membershipPause.toJSON();

    const allPausesForMembership = await MembershipPause.find({
      membership_id: membershipPause.membership_id,
      archived: false,
    });
    const sortedPausesForMembership = _.sortBy(allPausesForMembership, 'start_date');
    const lastMembershipPause = sortedPausesForMembership.pop().toJSON();
    if (inputs.id !== parseInt(lastMembershipPause.id)) {
      return exits.success(
        await sails.helpers.applicationError.buildResponse('OnlyTheLastMembershipPauseCanBeChanged', this.req),
      );
    }

    const now = moment.tz('Europe/Copenhagen');
    const todayIsoDate = now.format('YYYY-MM-DD');
    const nowIsoTime = now.format('HH:mm:ss');

    if (membershipPause.end_date < todayIsoDate) {
      return exits.success(
        await sails.helpers.applicationError.buildResponse('MembershipPauseHasEndedAndCanNotBeChanged', this.req),
      );
    }

    const resultingStartDate = inputs.start_date || lastMembershipPause.start_date;
    const resultingEndDate = typeof inputs.end_date !== 'undefined' ? inputs.end_date : lastMembershipPause.end_date;
    if (resultingEndDate && resultingEndDate <= resultingStartDate) {
      return exits.success(
        await sails.helpers.applicationError.buildResponse(
          'MembershipPauseEndDateMustBeSameOrAfterStartDate',
          this.req,
        ),
      );
    }

    const resultingPaymentDate = await sails.helpers.memberships.calculatePaymentDateWithMembershipPause(
      membershipPause.membership_id,
      resultingStartDate,
      resultingEndDate,
    );

    const resultingPaymentDateMoment = moment.tz(resultingPaymentDate, 'Europe/Copenhagen');

    if (
      resultingPaymentDate < todayIsoDate
      && now.diff(resultingPaymentDateMoment, 'days') > 28
    ) {
      return exits.success(
        await sails.helpers.applicationError.buildResponse(
          'CantEditMembershipPauseBecausePaymentDateIsTooEarly',
          this.req,
        ),
      );
    }


    /*if (userContext === 'customer') {

      if (inputs.start_date && inputs.start_date !== membershipPause.start_date && inputs.start_date < todayIsoDate) {
        return exits.success(
          await sails.helpers.applicationError.buildResponse('membershipPauseCanNotStartBeforeToday', this.req),
        );
      }

      const {
        customer_can_pause_membership: customerCanPauseMembership,
        membership_pause_max_count_per_running_year: membershipPauseMaxCountPerRunningYear,
        customer_can_pause_membership_indefinitely: customerCanPauseMembershipIndefinitely,
        membership_pause_max_days_per_pause: membershipPauseMaxDaysPerPause,
      } = await sails.helpers.clientSettings.find(this.request.client, [
        'customer_can_pause_membership',
        'membership_pause_max_count_per_year',
        'customer_can_pause_membership_indefinitely',
        'membership_pause_max_days_per_pause',
      ]);

      if (!customerCanPauseMembership) {
        return exits.success(
          await sails.helpers.applicationError.buildResponse('customersCanNotPauseMemberships', this.req),
        );
      }

      if (inputs.end_date === null && !customerCanPauseMembershipIndefinitely) {
        return exits.success(
          await sails.helpers.applicationError.buildResponse('customersCanNotPauseMembershipsIndefinitely', this.req),
        );
      }

      if (inputs.start_date) {

        const membershipPausesOneYearBack = await knex({m: 'membership'})
          .where({
            membership_id: inputs.membership,
            archived: 0,
          })
          .andWhere(
            'start_date',
            '<',
            moment.tz(inputs.start_date, 'Europe/Copenhagen').subtract(1, 'year').format('YYYY-MM-DD'),
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

    } else {*/
      // Admin (or Teacher (later))
      if (inputs.fee && membershipPause.fee_paid_with_order_id) {
        return exits.success(
          await sails.helpers.applicationError.buildResponse(
            'MembershipPauseFeePaidAndCanNotBeChanged',
            this.req,
          ),
        );
      }
    //}

    if (inputs.fee && !membershipPause.fee) {
      await MembershipPause.update({id: membershipPause.id}, {fee: inputs.fee});
      const feePaymentSuccess = await sails.helpers.membershipPause.collectFee(membershipPause);

      if (!feePaymentSuccess) {
        await MembershipPause.update({id: membershipPause.id}, {fee: 0});
        return exits.success(
          await sails.helpers.applicationError.buildResponse(
            'MembershipPauseFeeWasDeclined',
            this.req,
          ),
        );
      }
    }

    const updatedMembershipPause = await MembershipPause.update(
      {
        id: inputs.id,
      },
      {
        start_date: inputs.start_date || undefined,
        end_date: inputs.end_date !== undefined ? inputs.end_date : undefined,
        //fee: userContext !== 'customer' ? (inputs.fee || undefined) : undefined,
        //comment: userContext !== 'customer' ? (inputs.comment || undefined) : undefined,
        fee: inputs.fee || undefined,
        comment: inputs.comment || undefined,
      },
    );

    await sails.helpers.memberships.cancelFutureSignups.with({
      membership: membershipPause.membership_id,
      startDate: resultingStartDate <= todayIsoDate ? todayIsoDate : resultingStartDate,
      startTime: resultingStartDate <= todayIsoDate ? nowIsoTime : '00:00:00',
      endDate: resultingEndDate ? moment(resultingEndDate).subtract(1, 'day').format('YYYY-MM-DD') : undefined,
      userGetsRefundAfterDeadline: userContext === 'admin',
      onlyCancelSignupsWithoutAccess: false,
    });

    let logEntry = i18n.__('membershipLog.MembershipPauseChanged');
    if (inputs.start_date && inputs.start_date !== membershipPause.start_date) {
      logEntry += ' ' + i18n.__(
        'membershipLog.XChangedFromYToZ',
        i18n.__('membershipLog.StartDate'),
        sails.helpers.util.formatDate(membershipPause.start_date, locale),
        sails.helpers.util.formatDate(inputs.start_date, locale),
      );
    }

    if (typeof inputs.end_date !== 'undefined' && inputs.end_date !== membershipPause.end_date) {
      logEntry += ' ' + i18n.__('membershipLog.XChangedFromYToZ',
        i18n.__('membershipLog.EndDate'),
        membershipPause.end_date
          ? sails.helpers.util.formatDate(membershipPause.end_date, locale)
          : i18n.__('membershipLog.indefinitely'),
        inputs.end_date
          ? sails.helpers.util.formatDate(inputs.end_date, locale)
          : i18n.__('membershipLog.indefinitely'),
      );
    }

    if (typeof inputs.fee !== 'undefined' && parseInt(inputs.fee) !== parseInt(membershipPause.fee)) {
      logEntry += ' ' + i18n.__('membershipLog.XChangedFromYToZ',
        i18n.__('membershipLog.Fee'),
        currencyDkk(membershipPause.fee) + ' kr',
        currencyDkk(inputs.fee) + ' kr',
      );
    }

    if (typeof inputs.comment !== 'undefined' && inputs.comment !== membershipPause.comment) {
      logEntry += ' ' + i18n.__('membershipLog.XChangedFromYToZ',
        i18n.__('membershipLog.Comment'),
        `"${membershipPause.comment}"`,
        `"${inputs.comment}"`,
      );
    }

    const adminUserName = `${this.req.user.first_name} ${this.req.user.last_name}`.trim();
    logEntry += ` ${i18n.__('membershipLog.AdminUserColonName', adminUserName)}`;

    await sails.helpers.membershipLog.log(
      membershipPause.membership_id,
      logEntry,
    );

    return exits.success(updatedMembershipPause);


  },
};
