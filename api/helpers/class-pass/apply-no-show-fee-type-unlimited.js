module.exports = {
  friendlyName: 'Apply no-show fee to unlimited type class pass',

  description: 'This applies to regular studio attendance class signups only. It makes no sense to penalize livestream signups.',

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
    ).populate('used_class_pass');

    const {
      no_show_time_based_class_pass_deduct_number_of_days: deductDaysNoShow,
      no_show_fees_and_late_cancel_fees_are_different: noShowAndLateCancelFeesAreDifferent,
      late_cancel_time_based_class_pass_deduct_number_of_days: deductDaysLateCancel,
    } = await sails.helpers.clientSettings.find(classSignup.client, [
      'no_show_time_based_class_pass_deduct_number_of_days',
      'no_show_fees_and_late_cancel_fees_are_different',
      'late_cancel_time_based_class_pass_deduct_number_of_days',
    ]);

    const deductDays = noShowAndLateCancelFeesAreDifferent && inputs.reason === 'late_cancel'
      ? deductDaysLateCancel
      : deductDaysNoShow;

    const updateClassSignupResult = await knex({cs: 'class_signup'})
      .update({no_show_fee_applied: 1})
      .where({
        id: classSignup.id,
        no_show_fee_applied: 0,
      });

    if (updateClassSignupResult < 1) {
      // Already penalized
      return exits.success();
    }

    if (!inputs.no_show_fee_cancelled) {
      await knex({cp: 'class_pass'})
        .where({id: classSignup.used_class_pass.id})
        .update({valid_until: knex.raw('valid_until - INTERVAL :days DAY', {days: deductDays})});
    }

    const createdFee = await NoShowFee.create({
      client_id: classSignup.client,
      user_id: classSignup.user,
      class_id: classSignup.class,
      days_deducted: deductDays,
      class_signup_id: classSignup.id,
      reason: inputs.reason,
      cancelled_at: inputs.no_show_fee_cancelled ? Date.now() : 0,
      class_pass_id: classSignup.used_class_pass.id,
    }).fetch();

    const updatedClassPass = await ClassPass.findOne(classSignup.used_class_pass.id);

    const locale = await sails.helpers.clientSettings.find(classSignup.client, 'locale');
    const newValidUntilDate = sails.helpers.util.formatDate(updatedClassPass.valid_until, locale);

    const dayString = sails.helpers.util.timeIntervalInHumanFormat(deductDays, 'day', locale);
    const classDescription = await sails.helpers.classes.getDescription(classSignup.class);
    const logMessage = sails.helpers.t(
      inputs.no_show_fee_cancelled
        ? (
          inputs.reason === 'no_show'
            ? 'classPassLog.NoShowDayChargedFromClassPassPendingReview'
            : 'classPassLog.LateCancelDayChargedFromClassPassPendingReview'
        )
        : (
          inputs.reason === 'no_show'
            ? 'classPassLog.NoShowDayChargedFromClassPassForNonAttendance'
            : 'classPassLog.NoShowDayChargedFromClassPassForLateCancellation'
        ),
      [dayString, classDescription, newValidUntilDate],
    );
    await sails.helpers.classPassLog.log(classSignup.used_class_pass, logMessage);

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
