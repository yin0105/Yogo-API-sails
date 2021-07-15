const moment = require('moment-timezone');
const currencyDkk = require('../../filters/currency_dkk');

module.exports = {
  friendlyName: 'Update membership',

  inputs: {
    id: {
      type: 'number',
      required: true,
    },
    status: {
      type: 'string',
      isIn: ['active', 'cancelled_running', 'ended'],
    },
    payment_option: {
      type: 'number',
    },
    membership_type: {
      type: 'number',
    },
    paid_until: {
      type: 'string',
      custom: d => d.match(/^\d\d\d\d-\d\d-\d\d$/),
    },
    discount_code: {
      type: 'number',
      allowNull: true,
    },
  },

  exits: {
    badRequest: {
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {

    const locale = this.req.i18n.getLocale();

    const updateData = _.pick(inputs, [
      'status',
      'payment_option',
      'membership_type',
      'paid_until',
      'discount_code',
    ]);

    const membership = await Membership.findOne({id: inputs.id, archived: 0})
      .populate('membership_type')
      .populate('payment_option')
      .populate('discount_code');

    const currentUserName = this.req.user.first_name + ' ' + this.req.user.last_name;

    moment.locale(locale);

    if (updateData.status && updateData.status === 'cancelled_running') {

      if (membership.status === 'cancelled_running') {
        return exits.success();
      }

      if (membership.status !== 'active') {
        return exits.badRequest('E_MEMBERSHIP_NOT_ACTIVE');
      }

      let cancelledFromDate;
      if (membership.payment_option.number_of_months_payment_covers === 1) {
        cancelledFromDate = moment(membership.paid_until).add(1, 'month').add(1, 'day');
      } else {
        cancelledFromDate = moment(membership.paid_until).add(1, 'day');
      }
      const cancelledFromDateIso = cancelledFromDate.format('YYYY-MM-DD');

      await Membership.update({id: inputs.id}, {
        status: 'cancelled_running',
        cancelled_from_date: cancelledFromDateIso,
      });

      await sails.helpers.populate.memberships.currentOrUpcomingMembershipPause([membership]);
      await sails.helpers.populate.memberships.membershipPauseLength([membership]);

      let cancelledFromDateIncludingMembershipPause;
      let membershipPauseArchived = false;
      if (membership.current_or_upcoming_membership_pause) {
        if (membership.current_or_upcoming_membership_pause.start_date < cancelledFromDateIso) {
          cancelledFromDateIncludingMembershipPause = cancelledFromDate.add(
            membership.membership_pause_length,
            'days',
          );
        } else {
          cancelledFromDateIncludingMembershipPause = cancelledFromDate;
          await MembershipPause.update(
            {id: membership.current_or_upcoming_membership_pause.id},
            {archived: true},
          );
          membershipPauseArchived = true;
        }
      } else {
        cancelledFromDateIncludingMembershipPause = cancelledFromDate;
      }

      await sails.helpers.memberships.cancelFutureSignups.with({
        membership: membership,
        startDate: cancelledFromDateIncludingMembershipPause.format('YYYY-MM-DD'),
        userGetsRefundAfterDeadline: true,
      });

      let logEntry;
      if (this.req.authorizedRequestContext === 'admin') {
        logEntry = sails.helpers.t('membershipLog.MembershipCancelledByAdmin', [
          sails.helpers.util.formatDate(moment(cancelledFromDateIncludingMembershipPause).subtract(1, 'day'), locale),
          currentUserName,
        ]);
        if (membershipPauseArchived) {
          logEntry += ' ' + sails.helpers.t(
            'membershipLog.ScheduledMembershipPauseWithStartDateRemoved',
            sails.helpers.util.formatDate(membership.current_or_upcoming_membership_pause.start_date, locale),
          );
        }
        logEntry += ' ' + sails.helpers.t(
          'membershipLog.AdminUserColonName', currentUserName,
        );
      } else {
        logEntry = sails.helpers.t('membershipLog.MembershipCancelledByCustomer', [
          moment(cancelledFromDateIncludingMembershipPause).subtract(1, 'day').format('D. MMMM YYYY'),
        ]);
      }

      await MembershipLog.log(
        membership,
        logEntry,
      );

      await sails.helpers.email.customer.customerCancelledMembership(membership);

      return exits.success();
    }

    if (updateData.status && updateData.status === 'active') {
      if (membership.status === 'active') {
        return exits.success();
      }
      if (
        moment.tz('Europe/Copenhagen').isSameOrAfter(
          moment.tz(membership.cancelled_from_date, 'Europe/Copenhagen'),
          'day',
        )
        || membership.status !== 'cancelled_running'
      ) {
        return exits.badRequest('E_MEMBERSHIP_HAS_RUN_OUT');
      }
      await Membership.update({id: inputs.id}, {status: 'active'});

      let logEntry;
      if (this.req.requestContext === 'admin') {
        logEntry = sails.helpers.t('membershipLog.MembershipReactivatedByAdmin', [currentUserName]);
      } else {
        logEntry = sails.helpers.t('membershipLog.MembershipReactivatedByCustomer');
      }

      await MembershipLog.log(
        membership,
        logEntry,
      );

      await sails.helpers.email.customer.customerReactivatedCancelledMembership(membership);

      return exits.success();
    }


    if (updateData.status && updateData.status === 'ended') {

      await Membership.update({id: inputs.id}, {
        status: 'ended',
        ended_because: 'admin_action',
      });

      const now = moment.tz('Europe/Copenhagen');
      await sails.helpers.memberships.cancelFutureSignups.with({
        membership: membership,
        startDate: now.format('YYYY-MM-DD'),
        startTime: now.format('HH:mm:ss'),
        userGetsRefundAfterDeadline: true,
      });

      const logEntry = 'Medlemskab stoppet fra admin, med øjeblikkelig virkning.'
        + ' Admin-bruger: ' + this.req.user.first_name + ' ' + this.req.user.last_name;

      await MembershipLog.log(
        membership,
        logEntry,
      );

      return exits.success();
    }

    if (updateData.payment_option) {
      const newPaymentOption = await MembershipTypePaymentOption.findOne(updateData.payment_option);

      if (updateData.membership_type) {
        const newMembershipType = await MembershipType.findOne(updateData.membership_type);
        if (newPaymentOption.membership_type !== newMembershipType.id) {
          return exits.badRequest('Payment option does not belong to membership type.');
        }
        await Membership.update({id: membership.id}, {
          membership_type: updateData.membership_type,
          payment_option: updateData.payment_option,
        });

        const now = moment.tz('Europe/Copenhagen');
        await sails.helpers.memberships.cancelFutureSignups.with({
          membership: membership,
          startDate: now.format('YYYY-MM-DD'),
          startTime: now.format('HH:mm:ss'),
          userGetsRefundAfterDeadline: true,
          onlyCancelSignupsWithoutAccess: true,
        });

        const logEntry = sails.helpers.t('membershipLog.MembershipTypeChanged', [
          `${membership.membership_type.name}, ${membership.payment_option.name} / ${currencyDkk(membership.payment_option.payment_amount)} kr.`,
          `${newMembershipType.name}, ${newPaymentOption.name} / ${currencyDkk(newPaymentOption.payment_amount)} kr`,
          currentUserName,
        ]);
        await MembershipLog.log(
          membership,
          logEntry,
        );

        return exits.success();
      }

      if (newPaymentOption.membership_type !== membership.membership_type.id) {
        return exits.badRequest('Payment option does not belong to current membership type.');
      }

      await Membership.update({id: membership.id}, {
        payment_option: updateData.payment_option,
      });
      const logEntry = sails.helpers.t('membershipLog.PaymentOptionChanged', [
        `${membership.payment_option.name} / ${currencyDkk(membership.payment_option.payment_amount)} kr.`,
        `${newPaymentOption.name} / ${currencyDkk(newPaymentOption.payment_amount)} kr`,
        currentUserName,
      ]);
      await MembershipLog.log(
        membership,
        logEntry,
      );

      return exits.success();
    }

    if (updateData.paid_until) {

      const newPaidUntil = moment(updateData.paid_until);
      if (newPaidUntil.isBefore(moment().subtract(28, 'days'))) {
        return exits.badRequest('New paid_until can not be more than 28 days before today.');
      }

      await Membership.update({id: membership.id}, {
        paid_until: newPaidUntil.format('YYYY-MM-DD'),
      });

      const logEntry = sails.helpers.t('membershipLog.NextPaymentDateChanged', [
        sails.helpers.util.formatDate(moment(membership.paid_until).add(1, 'day'), locale),
        sails.helpers.util.formatDate(newPaidUntil.add(1, 'day'), locale),
        currentUserName,
      ]);
      await MembershipLog.log(
        membership,
        logEntry,
      );

      return exits.success();

    }

    if (typeof updateData.discount_code !== 'undefined') {

      await Membership.update({id: membership.id}, {discount_code: updateData.discount_code});

      let discountCodeLogEntry;

      if (updateData.discount_code) {
        const newDiscountCode = await DiscountCode.findOne(updateData.discount_code);

        if (membership.discount_code) {
          discountCodeLogEntry = sails.helpers.t('membershipLog.DiscountCodeChanged', [
            membership.discount_code.name,
            newDiscountCode.name,
            currentUserName,
          ]);
        } else {
          discountCodeLogEntry = sails.helpers.t('membershipLog.DiscountCodeAdded', [
            newDiscountCode.name,
            currentUserName,
          ]);
        }

      } else {
        if (membership.discount_code) {
          discountCodeLogEntry = sails.helpers.t('membershipLog.DiscountCodeRemoved', [
            membership.discount_code.name,
            currentUserName,
          ]);
        } else {
          return exits.success();
        }
      }

      await MembershipLog.log(
        membership,
        discountCodeLogEntry,
      );

      return exits.success();
    }

    return exits.badRequest('Updating membership, but input data was invalid.');

  },

};
