const ObjectionClass = require('../../objection-models/Class');

module.exports = {
  friendlyName: 'Cancel class',

  exits: {
    classHasBeenDeleted: {
      responseType: 'badRequest',
    },
    classIsAlreadyCancelled: {
      responseType: 'badRequest',
    },
    forbidden: {
      responseType: 'forbidden',
    },
  },

  fn: async function (inputs, exits) {

    if (!await sails.helpers.can2('controller.Classes.cancel', this.req)) {
      return exits.forbidden();
    }

    const classItem = await ObjectionClass.query()
      .where('id', this.req.param('id'))
      .first()
      .eager({
        class_type: true,
        signups: {
          user: true,
        },
        waiting_list_signups: {
          user: true,
        },
        livestream_signups: {
          user: true,
        },
      })
      .modifyEager(
        'signups',
        builder => builder.where({archived: 0, cancelled_at: 0}),
      )
      .modifyEager(
        'waiting_list_signups',
        builder => builder.where({archived: 0, cancelled_at: 0}),
      )
      .modifyEager(
        'livestream_signups',
        builder => builder.where({archived: 0, cancelled_at: 0}),
      );

    if (classItem.archived) {
      return exits.classHasBeenDeleted('Class has been deleted');
    }

    if (classItem.cancelled) {
      return exits.classIsAlreadyCancelled('Class is already cancelled');
    }


    const classDescription = await sails.helpers.classes.getDescription(classItem);


    // Refund customer signups. Don't remove them because the signup data still needs to be available
    await Promise.all(_.map(
      classItem.signups,
      async signup => {
        const refundResponse = await sails.helpers.classSignups.refundClassPassForSignup(signup);
        if (refundResponse.classPassWasRefunded) {
          const classPassId = sails.helpers.util.idOrObjectIdInteger(signup.used_class_pass_id);
          const updatedClassPass = await ClassPass.findOne(classPassId);
          const logMessage = sails.helpers.t('classPassLog.classPassRefundedBecauseClassWasCancelled', [
            classDescription,
            updatedClassPass.classes_left,
          ]);
          await sails.helpers.classPassLog.log(updatedClassPass, logMessage);
        }

        await sails.helpers.sms.customer.yourClassHasBeenCancelled(signup, 'studio_attendance');
        await sails.helpers.email.customer.yourClassHasBeenCancelled(signup, 'studio_attendance');
      },
    ));


    // Refund waiting list signups.
    await Promise.all(_.map(
      classItem.waiting_list_signups,
      async waitingListSignup => {
        const refundResponse = await sails.helpers.classWaitingListSignups.refundClassPassForWaitingListSignup(waitingListSignup);
        if (refundResponse.classPassWasRefunded) {
          const classPassId = sails.helpers.util.idOrObjectIdInteger(waitingListSignup.used_class_pass_id);
          const updatedClassPass = await ClassPass.findOne(classPassId);
          const classDescription = await sails.helpers.classes.getDescription(classItem);
          const logMessage = sails.helpers.t('classPassLog.classPassRefundedBecauseClassWasCancelled', [
            classDescription,
            updatedClassPass.classes_left,
          ]);
          await sails.helpers.classPassLog.log(updatedClassPass, logMessage);
        }
        await sails.helpers.email.customer.yourWaitingListClassHasBeenCancelled(waitingListSignup);
      },
    ));


    // Clear waiting list
    await ClassWaitingListSignup.update({
      'class': classItem.id,
      archived: false,
      cancelled_at: 0,
    }, {
      cancelled_at: Date.now(),
    });


    // Refund customer livestream signups. Don't remove them because the signup data still needs to be available
    await Promise.all(_.map(
      classItem.livestream_signups,
      async livestreamSignup => {
        const refundResponse = await sails.helpers.classSignups.refundClassPassForSignup(livestreamSignup, 'livestream');
        if (refundResponse.classPassWasRefunded) {
          const classPassId = sails.helpers.util.idOrObjectIdInteger(livestreamSignup.used_class_pass_id);
          const updatedClassPass = await ClassPass.findOne(classPassId);
          const logMessage = sails.helpers.t('classPassLog.classPassRefundedBecauseClassWasCancelled', [
            classDescription,
            updatedClassPass.classes_left,
          ]);
          await sails.helpers.classPassLog.log(updatedClassPass, logMessage);
        }

        await sails.helpers.sms.customer.yourClassHasBeenCancelled(livestreamSignup, 'livestream');
        await sails.helpers.email.customer.yourClassHasBeenCancelled(livestreamSignup, 'livestream');
      },
    ));


    // Mark class as cancelled
    await Class.update({id: classItem.id}, {cancelled: true});


    // Done
    return exits.success();
  },
};
