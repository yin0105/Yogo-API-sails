const moment = require('moment');

module.exports = {
  friendlyName: 'Populate membership next payment',

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

    if (typeof inputs.memberships[0].next_payment !== 'undefined') {
      return exits.success();
    }

    await sails.helpers.memberships.checkForEndedPausesAndPushDates(inputs.memberships);

    await sails.helpers.populate.belongsToOneRelation(inputs.memberships, 'membership_campaign', 'MembershipCampaign');
    await sails.helpers.populate.belongsToOneRelation(inputs.memberships, 'payment_option', 'MembershipTypePaymentOption');
    await sails.helpers.populate.belongsToOneRelation(inputs.memberships, 'discount_code', 'DiscountCode');
    await sails.helpers.populate.hasManyRelation(inputs.memberships, 'membership_pauses','MembershipPause', 'membership_id');


    await Promise.all(_.map(inputs.memberships, async membership => {

      if (membership.status === 'ended') {
        membership.next_payment = null;
        return;
      }

      const paidUntil = sails.helpers.util.normalizeDate(membership.paid_until);

      if (membership.status === 'cancelled_running') {
        const cancelledFromDate = sails.helpers.util.normalizeDate(membership.cancelled_from_date);

        if (cancelledFromDate.isSameOrBefore(moment(paidUntil).add(1, 'day'), 'day')) {
          membership.next_payment = null;
          return;
        }
      }

      const nextPaymentDate = moment(paidUntil).add(1, 'day');
      const nextPaymentIsoDate = nextPaymentDate.format('YYYY-MM-DD');

      membership.next_payment = {};

      const latestMembershipPause = _.sortBy(membership.membership_pauses, 'start_date').pop();

      if (latestMembershipPause && latestMembershipPause.start_date <= nextPaymentIsoDate) {
        if (latestMembershipPause.end_date) {
          const pauseLength = moment(latestMembershipPause.end_date)
            .diff(latestMembershipPause.start_date, 'days');

          membership.next_payment.date = nextPaymentDate.add(pauseLength, 'days').format('YYYY-MM-DD');
        } else {
          membership.next_payment.date = null;
        }

      } else {
        membership.next_payment.date = nextPaymentIsoDate;
      }


      membership.next_payment.amount = (
        membership.membership_campaign
        && membership.membership_campaign_number_of_reduced_payments_left > 0
      )
        ? membership.membership_campaign.reduced_price
        : membership.payment_option.payment_amount;


      const membershipTypeId = sails.helpers.util.idOrObjectIdInteger(
        membership.membership_type || membership.membership_type_id,
      );
      if (membership.discount_code && sails.helpers.cart.isDiscountCodeValidForItem(
        membership.discount_code,
        'membership_type',
        membershipTypeId,
      )) {
        membership.next_payment.amount = await sails.helpers.discountCodes.getItemPriceWithDiscountCodeApplied(
          membership.next_payment.amount,
          membership.discount_code,
        );
      }

    }));

    return exits.success();
  },
};
