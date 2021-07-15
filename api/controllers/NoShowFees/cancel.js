const NoShowFeeObj = require('../../objection-models/NoShowFee');

module.exports = {
  friendlyName: 'Cancel no-show fee',

  inputs: {
    id: {
      type: 'number',
      required: true,
    },
  },

  exits: {
    forbidden: {
      responseType: 'forbidden',
    },
  },

  fn: async function (inputs, exits) {


    if (!(await sails.helpers.can2('controller.NoShowFees.cancel', this.req))) {
      return exits.forbidden();
    }

    const [noShowFee] = await NoShowFeeObj.query()
      .where({
        id: inputs.id,
        archived: false,
      })
      .eager({
        class_signup: {
          used_class_pass: {
            class_pass_type: true,
          },
          used_membership: true,
        },
      });

    if (noShowFee.paid_with_order_id > 0) {
      return exits.success(
        await sails.helpers.applicationError.buildResponse('noShowFeeAlreadyPaid', this.req),
      );
    }

    const updateCount = await knex({nsf: 'no_show_fee'})
      .where({
        id: inputs.id,
        cancelled_at: 0,
      })
      .update({
        cancelled_at: Date.now(),
      });

    if (!updateCount) return exits.success();

    const classDescription = await sails.helpers.classes.getDescription(noShowFee.class_id);
    let logMessage;

    if (noShowFee.class_signup.used_membership) {
      logMessage = sails.helpers.t('membershipLog.NoShowFeeAtAmountCancelledForClass', [`${noShowFee.amount} kr`, classDescription]);
    }

    if (noShowFee.class_signup.used_class_pass) {
      if (noShowFee.class_signup.used_class_pass.class_pass_type.pass_type === 'unlimited') {

        await knex({cp: 'class_pass'})
          .where({
            id: noShowFee.class_signup.used_class_pass.id,
          })
          .update('valid_until', knex.raw("valid_until + INTERVAL ? DAY", [noShowFee.days_deducted]));

        const [updatedClassPass] = await knex('class_pass').where({id: noShowFee.class_signup.used_class_pass.id});
        const locale = await sails.helpers.clientSettings.find(updatedClassPass.client, 'locale');
        const validUntil = sails.helpers.util.formatDate(updatedClassPass.valid_until, locale);
        const dayString = sails.helpers.util.timeIntervalInHumanFormat(noShowFee.days_deducted, 'day', locale);
        logMessage = sails.helpers.t('classPassLog.NoShowFeeDaysChargedCancelledForClass', [dayString, classDescription, validUntil]);

      } else {

        await knex({cp: 'class_pass'})
          .where({
            id: noShowFee.class_signup.used_class_pass.id,
          })
          .update('classes_left', knex.raw("classes_left + 1"));

        await knex({cs: 'class_signup'})
          .where({id: noShowFee.class_signup.id})
          .update({class_pass_seat_spent: false});

        const [updatedClassPass] = await knex('class_pass').where({id: noShowFee.class_signup.used_class_pass.id});
        logMessage = sails.helpers.t('classPassLog.NoShowFeeClassSpentCancelledForClass', [classDescription, updatedClassPass.classes_left]);

      }
    }

    logMessage += ` ${sails.helpers.t('global.User')}: ${this.req.user.first_name} ${this.req.user.last_name} (ID ${this.req.user.id}).`;

    if (noShowFee.class_signup.used_membership) {
      await sails.helpers.membershipLog.log(noShowFee.class_signup.used_membership.id, logMessage);
    }
    if (noShowFee.class_signup.used_class_pass) {
      await sails.helpers.classPassLog.log(noShowFee.class_signup.used_class_pass.id, logMessage);
    }

    const sendEmail = await sails.helpers.clientSettings.find(
      noShowFee.client_id,
      'no_show_fees_send_emails_on_apply_and_cancel',
    );
    if (sendEmail) {
      await sails.helpers.email.customer.noShowFeeAppliedOrCancelled(noShowFee);
    }

    return exits.success();

  },
};
