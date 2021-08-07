module.exports = {

  friendlyName: 'Destroy class signup',

  description: 'Destroys signup for class and refunds the class if a class pass with fixed number of classes was used for the signup.',

  inputs: {
    signup: {
      type: 'ref',
      description: 'The signup to destroy',
      required: true,
    },
    userGetsRefundAfterDeadline: {
      type: 'boolean',
      description: 'If there should be a refund if deadline is passed.',
      required: true,
    },
  },

  exits: {
    success: {},

    signupNotFound: {
      description: 'Signup was not found in the database',
    },

  },

  fn: async (inputs, exits) => {

    const signup = await ClassSignup.findOne(
      sails.helpers.util.idOrObjectIdInteger(inputs.signup),
    );

    if (!signup) throw 'signupNotFound';

    if (signup.cancelled_at) return exits.success('Signup already cancelled.');

    const classItem = await Class.findOne(signup.class);
    await sails.helpers.populate.classes.classSignoffDeadlineHasBeenExceeded([classItem]);

    const classDescription = await sails.helpers.classes.getDescription(classItem);

    const feeShouldBeApplied = classItem.class_signoff_deadline_has_been_exceeded && !inputs.userGetsRefundAfterDeadline;

    const noShowFeesApplyMethod = await sails.helpers.clientSettings.find(signup.client, 'no_show_fees_apply_method');
    let is_late_cancel = false;

    if (signup.used_class_pass) {

      const classPassBeforeCancellation = await ClassPass.findOne(signup.used_class_pass).populate('class_pass_type');

      if (classPassBeforeCancellation.class_pass_type.pass_type === 'fixed_count') {

        if (feeShouldBeApplied) {
          is_late_cancel = true;
          await sails.helpers.classPass.applyNoShowFeeTypeFixedCount.with({
            signup,
            reason: 'late_cancel',
          });

        } else {

          const refundResult = await sails.helpers.classSignups.refundClassPassForSignup.with({
            signup,
          });

          if (refundResult.classPassWasRefunded) {
            const refundedClassPass = await ClassPass.findOne(signup.used_class_pass);
            const logMessage = await sails.helpers.t(
              'classPassLog.classPassRefundedBecauseSignupWasCancelled',
              [classDescription, refundedClassPass.classes_left],
            );
            await sails.helpers.classPassLog.log(refundedClassPass, logMessage);
          } else {
            const nonRefundedClassPass = await ClassPass.findOne(signup.used_class_pass).populate('class_pass_type');

            const logMessage = await sails.helpers.t(
              'classPassLog.classPassNotRefundedBecauseReason',
              [classDescription, refundResult.localizedReasonForNotRefunding, nonRefundedClassPass.classes_left],
            );
            await sails.helpers.classPassLog.log(nonRefundedClassPass, logMessage);

          }

        }
      } else if (feeShouldBeApplied) {
        is_late_cancel = true;
        await sails.helpers.classPass.applyNoShowFeeTypeUnlimited.with({
          signup,
          reason: 'late_cancel',
          no_show_fee_cancelled: noShowFeesApplyMethod === 'manual'
        });
      }

    } else if (signup.used_membership && feeShouldBeApplied) {
      is_late_cancel = true;
      await sails.helpers.memberships.applyNoShowFee.with({
        signup,
        reason: 'late_cancel',
        no_show_fee_cancelled: noShowFeesApplyMethod === 'manual'
      });
    }

    
    await ClassSignup.update({id: signup.id}, {
      cancelled_at: Date.now(),
      late_cancel: is_late_cancel,
    });


    await sails.helpers.classes.checkIfWaitingListShouldBeApplied(classItem);

    await sails.helpers.classTypeEmails.checkAndSendForClassCancelBooking(signup);

    return exits.success();

  },
};
