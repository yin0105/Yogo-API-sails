const moment = require('moment-timezone')

module.exports = {

  friendlyName: 'Destroy class livestream signup',

  description: 'Destroys signup for class livestream and refunds the class if a class pass with fixed number of classes was used for the signup.',

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

    const signup = await ClassLivestreamSignup.findOne(
      sails.helpers.util.idOrObjectIdInteger(inputs.signup),
    )

    if (!signup) throw 'signupNotFound'

    if (signup.cancelled_at) return exits.success('Signup already cancelled.')

    const classItem = await Class.findOne(signup.class)
    const clientClassSignoffDeadline = await sails.helpers.clientSettings.find(
      signup.client,
      'class_livestream_signoff_deadline'
    )

    const classStart = moment.tz(classItem.toJSON().date + ' ' + classItem.start_time, 'Europe/Copenhagen');
    const deadline = moment(classStart).subtract(clientClassSignoffDeadline, 'minutes');

    const classDescription = await sails.helpers.classes.getDescription(classItem);

    if (signup.used_class_pass) {

      const classPass = await ClassPass.findOne(signup.used_class_pass).populate('class_pass_type');

      if (classPass.class_pass_type.pass_type === 'fixed_count') {

        if (moment().isBefore(deadline) || inputs.userGetsRefundAfterDeadline) {
          const refundResult = await sails.helpers.classSignups.refundClassPassForSignup.with({
            signup: signup,
            signupType: 'livestream',
          });
          if (refundResult.classPassWasRefunded) {
            const refundedClassPass = await ClassPass.findOne(signup.used_class_pass);
            const logMessage = await sails.helpers.t(
              'classPassLog.classPassRefundedBecauseSignupForLivestreamWasCancelled',
              [classDescription, refundedClassPass.classes_left],
            );
            await sails.helpers.classPassLog.log(refundedClassPass, logMessage);
          } else {
            const nonRefundedClassPass = await ClassPass.findOne(signup.used_class_pass).populate('class_pass_type');
            if (nonRefundedClassPass.class_pass_type.pass_type === 'fixed_count') {
              const logMessage = await sails.helpers.t(
                'classPassLog.classPassNotRefundedForLivestreamBecauseReason',
                [classDescription, refundResult.localizedReasonForNotRefunding],
              );
              await sails.helpers.classPassLog.log(nonRefundedClassPass, logMessage);
            }
          }
        } else {
          const reason = sails.helpers.t('classPassLog.cancellationDeadlineHasBeenExceeded');
          const nonRefundedClassPass = await ClassPass.findOne(signup.used_class_pass);
          const logMessage = await sails.helpers.t(
            'classPassLog.classPassNotRefundedBecauseReason',
            [classDescription, reason, nonRefundedClassPass.classes_left],
          );
          await sails.helpers.classPassLog.log(nonRefundedClassPass, logMessage);
        }
      }
    }

    await ClassLivestreamSignup.update({id: signup.id}, {
      cancelled_at: Date.now(),
    })

    await sails.helpers.classTypeEmails.checkAndSendForLivestreamCancelBooking(signup);

    return exits.success('Livestream signup cancelled.')

  },
}
