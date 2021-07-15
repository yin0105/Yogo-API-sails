module.exports = {
  friendlyName: 'Apply no-show fee to fixed count type class pass',

  description: 'This applies to regular studio attendance class signups only. It makes no sense to penalize livestream signups.',

  inputs: {
    signup: {
      type: 'ref',
      required: true,
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

    const updateClassSignupResult = await knex({cs: 'class_signup'})
      .update({no_show_fee_applied: 1})
      .where({
        id: classSignup.id,
        no_show_fee_applied: 0,
        class_pass_seat_spent: 1,
      });

    if (updateClassSignupResult < 1) {
      // Fee already applied
      return exits.success();
    }

    const createdFee = await NoShowFee.create({
      client_id: classSignup.client,
      user_id: classSignup.user,
      class_id: classSignup.class,
      classes_spent: 1,
      class_signup_id: classSignup.id,
      reason: inputs.reason,
      class_pass_id: classSignup.used_class_pass.id,
    }).fetch();

    const classDescription = await sails.helpers.classes.getDescription(classSignup.class);
    const logMessage = sails.helpers.t(
      inputs.reason === 'no_show'
        ? 'classPassLog.NoShowFeeAppliedToFixedCountClassPassForNonAttendance'
        : 'classPassLog.NoShowFeeAppliedToFixedCountClassPassForLateCancellation',
      [classDescription, classSignup.used_class_pass.classes_left],
    );

    await sails.helpers.classPassLog.log(classSignup.used_class_pass, logMessage);

    const sendEmail = await sails.helpers.clientSettings.find(
      classSignup.client,
      'no_show_fees_send_emails_on_apply_and_cancel',
    );
    if (sendEmail) {
      await sails.helpers.email.customer.noShowFeeAppliedOrCancelled(createdFee);
    }

    return exits.success();
  },
};
