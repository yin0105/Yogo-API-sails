const knex = require('../../services/knex');

module.exports = {

  friendlyName: 'Destroy class waiting list signup',

  description: 'Destroys class waiting list signup and refunds the class if a class pass with fixed number of classes was used for the signup.',

  inputs: {
    waitingListSignup: {
      type: 'ref',
      description: 'The waiting list signup to destroy',
      required: true,
    },
  },

  exits: {
    waitingListSignupNotFound: {
      description: 'Waiting list signup was not found in the database',
    },
  },

  fn: async (inputs, exits) => {

    const waitingListSignup = await ClassWaitingListSignup.findOne(
      sails.helpers.util.idOrObjectIdInteger(inputs.waitingListSignup),
    );

    if (!waitingListSignup) throw 'waitingListSignupNotFound';

    if (waitingListSignup.cancelled_at) return exits.success('Waiting list signup already cancelled.');

    const classDescription = await sails.helpers.classes.getDescription(waitingListSignup.class);


    if (waitingListSignup.used_class_pass) {

      const refundResult = await sails.helpers.classWaitingListSignups.refundClassPassForWaitingListSignup(waitingListSignup);

      if (refundResult.classPassWasRefunded) {
        const refundedClassPass = await ClassPass.findOne(waitingListSignup.used_class_pass);
        const logMessage = await sails.helpers.t(
          'classPassLog.classPassRefundedBecauseSignupForWaitingListWasCancelled',
          [classDescription, refundedClassPass.classes_left],
        );
        await sails.helpers.classPassLog.log(refundedClassPass, logMessage);
      } else {
        const nonRefundedClassPass = await ClassPass.findOne(waitingListSignup.used_class_pass).populate('class_pass_type');
        if (nonRefundedClassPass.class_pass_type.pass_type === 'fixed_count') {
          const logMessage = await sails.helpers.t(
            'classPassLog.classPassNotRefundedBecauseReason',
            [classDescription, refundResult.localizedReasonForNotRefunding],
          );
          await sails.helpers.classPassLog.log(nonRefundedClassPass, logMessage);
        }
      }

    }


    // Used for testing
    await sails.helpers.util.dummyHelper();

    await knex('class_waiting_list_signup')
      .where({id: waitingListSignup.id})
      .update('cancelled_at', Date.now());


    await sails.helpers.classTypeEmails.checkAndSendForWaitingListCancelBooking(waitingListSignup);

    return exits.success('Waiting list signup cancelled.');

  },
};
