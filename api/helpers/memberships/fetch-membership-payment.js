const moment = require('moment-timezone');
const NoShowFeeObj = require('../../objection-models/NoShowFee');

const currencyDkk = require('../../filters/currency_dkk');

module.exports = {  
  friendlyName: 'Fetch membership renewal payment',

  description: "Makes a call to the payment provider's api to get a membership payment and updates the system accordingly. Assumes that the membership actually needs a payment and that it has been locked appropriately.",

  inputs: {
    membership: {
      type: 'ref',
      required: true,
    },
  },

  exits: {
    success: {
      outputFriendlyName: 'Membership payment succeeded',
      outputDescription: 'Did the payment succeed, true or false?',
    },
    moreThanOnePaymentSubscription: {
      description: 'More than one payment subscription for membership',
    },
  },

  fn: async (inputs, exits) => {

    const cronLog = sails.helpers.cron.log;

    const membershipId = sails.helpers.util.idOrObjectIdInteger(inputs.membership);

    const membership = await Membership.findOne(membershipId)
      .populate('client')
      .populate('user')
      .populate('payment_subscriptions', {archived: false, status: 'active'})
      .populate('payment_option')
      .populate('membership_type')
      .populate('membership_campaign')
      .populate('discount_code');

    console.log("membership = ", membership)

    const locale = await sails.helpers.clientSettings.find(membership.client, 'locale');

    if (membership.payment_subscriptions.length > 1) {
      throw 'moreThanOnePaymentSubscription';
    }

    if (membership.payment_subscriptions.length === 0) {
      await sails.helpers.memberships.paymentFailedBecauseNoPaymentSubscriptions(membership);
      return exits.success(false);
    }

    const paymentCardId = membership.payment_subscriptions[0].card_prefix + 'XXXXXX' + membership.payment_subscriptions[0].card_last_4_digits;

    const doApplyMembershipCampaign = membership.membership_campaign && membership.membership_campaign_number_of_reduced_payments_left > 0;

    const doApplyDiscountCode = !!membership.discount_code;

    const priceBeforeDiscountCode = doApplyMembershipCampaign
      ? membership.membership_campaign.reduced_price
      : membership.payment_option.payment_amount;

    const price = doApplyDiscountCode
      ? await sails.helpers.discountCodes.getItemPriceWithDiscountCodeApplied(
        priceBeforeDiscountCode,
        membership.discount_code,
      )
      : priceBeforeDiscountCode;


    let order = await Order.create({
      client: membership.client.id,
      user: membership.user.id,
      total: price,
      test: !sails.config.productionPayments,
      membership: membership.id,
      payment_subscription: membership.payment_subscriptions[0].id,
      payment_service_provider: membership.payment_subscriptions[0].payment_service_provider,
    }).fetch();

    const monthUnitName = membership.payment_option.number_of_months_payment_covers > 1
      ? sails.helpers.t('time.months')
      : sails.helpers.t('time.month');

    // Set new paid_until date.
    let newPaidUntil = moment.tz(membership.paid_until, 'Europe/Copenhagen')
      .add(1, 'day')
      .add(membership.payment_option.number_of_months_payment_covers, 'months')
      .subtract(1, 'day');

    const paymentFrom = moment.tz(membership.paid_until, 'Europe/Copenhagen').add(1, 'day');
    let orderItemName = membership.membership_type.name + (doApplyMembershipCampaign ? ' - ' + membership.membership_campaign.name : '') + '. ' +
      sails.helpers.t('receipt.PaymentForXFromYToZ', [
        membership.payment_option.number_of_months_payment_covers + ' ' + monthUnitName,
        sails.helpers.util.formatDate(paymentFrom, locale, false),
        sails.helpers.util.formatDate(newPaidUntil, locale, false),
      ]);

    if (doApplyDiscountCode) {
      orderItemName += ` ${sails.helpers.t('discountCode.discountCode')}: "${membership.discount_code.name}".`;
    }

    await OrderItem.create({
      client: membership.client.id,
      order: order.id,
      item_type: 'membership_renewal',
      item_id: membership.id,
      name: orderItemName,
      count: 1,
      item_price: price,
      total_price: price,
      applied_discount_code_amount: doApplyDiscountCode ? (priceBeforeDiscountCode - price) : 0,
      membership_renewal_membership_type: membership.membership_type.id,
    }).fetch();

    const pendingFees = await NoShowFeeObj.query().alias('nsf')
      .where({
        paid_with_order_id: null,
        cancelled_at: 0,
        archived: 0,
        membership_id: membership.id,
      })
      .andWhere('amount', '>', 0);

    let pendingFeesTotalPrice = 0;
    if (pendingFees.length) {
      for (let i = 0; i < pendingFees.length; i++) {
        const pendingFee = pendingFees[i];
        const classDescription = await sails.helpers.classes.getDescription(pendingFee.class_id);
        const feeOrderItemName = sails.helpers.t('receipt.orderItemNoShowFee', [classDescription]);
        await OrderItem.create({
          client: membership.client.id,
          order: order.id,
          item_type: 'membership_no_show_fee',
          item_id: pendingFee.id,
          name: feeOrderItemName,
          count: 1,
          item_price: pendingFee.amount,
          total_price: pendingFee.amount,
        });

        pendingFeesTotalPrice += pendingFee.amount;
      }
      await Order.update({id: order.id}, {total: price + pendingFeesTotalPrice});
    }

    const paymentResult = await sails.helpers.order.payWithPaymentSubscription(
      order,
      membership.payment_subscriptions[0],
    )

    if (paymentResult.success) {

      const membershipUpdateData = {
        paid_until: newPaidUntil.format('YYYY-MM-DD'),
        renewal_failed: 0,
        renewal_failed_last_time_at: 0,
      };
      if (doApplyMembershipCampaign) {
        membershipUpdateData.membership_campaign_number_of_reduced_payments_left = membership.membership_campaign_number_of_reduced_payments_left - 1;
        if (membership.membership_campaign_number_of_reduced_payments_left <= 1) {
          membershipUpdateData.membership_campaign = null;
        }
      }

      await Membership.update({
          id: membership.id,
        }, membershipUpdateData,
      );

      await cronLog('updated membership: ' + membership.id);


      await MembershipLog.create({
        membership: membership.id,
        user: membership.user.id,
        client: membership.client.id,
        entry: 'Medlemskab blev fornyet. Der blev trukket ' + currencyDkk(order.total) + ' kr. på betalingskortet ' + paymentCardId + '.',
      });

      if (pendingFees.length) {
        const classDescriptions = [];
        for (let i = 0; i < pendingFees.length; i++) {
          const pendingFee = pendingFees[i];
          const updatedRows = await NoShowFee.update({
            id: pendingFee.id,
            paid_with_order_id: null,
          }, {
            paid_with_order_id: order.id,
          }).fetch();
          if (updatedRows && updatedRows.length) {
            await cronLog('Fee paid, id ' + pendingFee.id);
          } else {
            await cronLog('It seems fee has been paid twice! Id:' + pendingFee.id);
          }
          classDescriptions.push(
            await sails.helpers.classes.getDescription(pendingFee.class_id),
          );
        }

        const membershipLogForFees = await sails.helpers.t(
          pendingFees.length > 1
            ? 'membershipLog.NoShowFeesPaid'
            : 'membershipLog.NoShowFeePaid',
          [classDescriptions.join(', ')],
        );
        await sails.helpers.membershipLog.log(membership.id, membershipLogForFees);
      }


      // Set system_updated

      await Order.update({
        id: order.id,
      }, {
        system_updated: Date.now(),
      });

      // Send invoice
      const shouldSendInvoiceOnEmail = await sails.helpers.clientSettings.find(
        order.client,
        'send_receipt_on_email_for_automatic_membership_payments'
      );
      if (shouldSendInvoiceOnEmail) {
        await sails.helpers.email.customer.receipt(order.id);
      }

      await Order.update(
        {
          id: order.id,
        }, {
          receipt_sent: Date.now(),
        },
      );

      return exits.success(true);

    } else {

      const membershipFailedTimes = parseInt(membership.renewal_failed) + 1;

      const membershipNumberOfFailedPaymentAttemptsBeforeTermination = await sails.helpers.clientSettings.find(
        order.client,
        'membership_number_of_failed_payment_attempts_before_termination',
      );

      const terminateMembership = membershipFailedTimes >= membershipNumberOfFailedPaymentAttemptsBeforeTermination;

      const updateMembershipData = {
        renewal_failed: membershipFailedTimes,
        renewal_failed_last_time_at: Date.now(),
      };

      let cronLogText = `Fornyelse af medlemskab fejlede for ${membershipFailedTimes}. gang. Der kunne ikke trækkes ${currencyDkk(order.total)} kr. på betalingskortet ${paymentCardId}.`;

      if (terminateMembership) {
        updateMembershipData.status = 'ended';
        updateMembershipData.ended_because = 'payment_failed';
        cronLogText += ' Medlemskabet er nu afsluttet.';
      }

      await Membership.update({
        id: membership.id,
      }, updateMembershipData);

      await MembershipLog.create({
        membership: membership.id,
        user: membership.user.id,
        client: membership.client.id,
        entry: cronLogText,
      });

      await sails.helpers.email.customer.membershipRenewalFailed(membership);

      return exits.success(false);

    }

  },

};
