module.exports = {
  friendlyName: 'Apply no-show fee for missed class signup',

  description: 'This only applies to regular attendance class signups. It makes no sense to penalize livestream signups',

  inputs: {
    signup: {
      type: 'ref',
      required: true,
    },
    no_show_fee_cancelled: {
      type: 'boolean',
      defaultsTo: false,
    },
    reason: {
      type: 'string',
      isIn: ['no_show', 'late_cancel'],
      required: true,
    },
  },

  fn: async (inputs, exits) => {

    const classSignup = await ClassSignup.findOne(
      sails.helpers.util.idOrObjectIdInteger(inputs.signup),
    );

    const updateResult = await knex({cs: 'class_signup'})
      .where({
        id: classSignup.id,
        no_show_fee_applied: 0,
      })
      .update({
        no_show_fee_applied: 1,
      });

    if (!updateResult) {
      // Fee already applied
      return exits.success();
    }

    const {
      no_show_membership_fee_amount: noShowFeeAmount,
      no_show_fees_and_late_cancel_fees_are_different: noShowAndLateCancelFeesAreDifferent,
      late_cancel_membership_fee_amount: lateCancelFeeAmount,
    } = await sails.helpers.clientSettings.find(classSignup.client,
      [
        'no_show_membership_fee_amount',
        'no_show_fees_and_late_cancel_fees_are_different',
        'late_cancel_membership_fee_amount',
      ],
    );

    const feeAmount = noShowAndLateCancelFeesAreDifferent && inputs.reason === 'late_cancel'
      ? lateCancelFeeAmount
      : noShowFeeAmount;


    const now = Date.now();
    const noShowFeeData = {
      client_id: classSignup.client,
      user_id: classSignup.user,
      class_id: classSignup.class,
      amount: feeAmount,
      class_signup_id: classSignup.id,
      reason: inputs.reason,
      cancelled_at: inputs.no_show_fee_cancelled ? now : 0,
      membership_id: classSignup.used_membership,
    };

    const createdFee = await NoShowFee.create(noShowFeeData).fetch();


    const classDescription = await sails.helpers.classes.getDescription(classSignup.class);

    const logMessage = inputs.no_show_fee_cancelled
      ? (
        inputs.reason === 'no_show'
          ? sails.helpers.t('membershipLog.NoShowFeeCreatedPendingReview', [`${feeAmount} kr`, classDescription])
          : sails.helpers.t('membershipLog.LateCancelFeeCreatedPendingReview', [`${feeAmount} kr`, classDescription])
      )
      : (
        inputs.reason === 'no_show'
          ? sails.helpers.t('membershipLog.NoShowFeeCreatedForNonAttendance', [`${feeAmount} kr`, classDescription])
          : sails.helpers.t('membershipLog.NoShowFeeCreatedForLateCancellation', [`${feeAmount} kr`, classDescription])
      );

    await sails.helpers.membershipLog.log(classSignup.used_membership, logMessage);

    if (!inputs.no_show_fee_cancelled) {
      const sendEmail = await sails.helpers.clientSettings.find(
        classSignup.client,
        'no_show_fees_send_emails_on_apply_and_cancel',
      );
      if (sendEmail) {
        await sails.helpers.email.customer.noShowFeeAppliedOrCancelled(createdFee);
      }
    }

    return exits.success();
  },
};
