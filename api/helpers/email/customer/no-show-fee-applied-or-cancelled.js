const NoShowFeeObj = require('../../../objection-models/NoShowFee');

module.exports = {

  friendlyName: 'Email: Customer waiting list signup converted to class signup',

  description: 'This email should be sent after changing the fee, as it reads cancellation status from the fee',

  inputs: {
    noShowFee: {
      type: 'ref',
      description: 'The fee',
      required: true,
    },
  },

  fn: async (inputs, exits) => {

    const emailLogger = sails.helpers.logger('email');

    const feeId = sails.helpers.util.idOrObjectIdInteger(inputs.noShowFee);

    emailLogger.info('no-show-fee-applied-or-cancelled, fee: ' + feeId);

    const [fee] = await NoShowFeeObj.query()
      .where({id: feeId})
      .eager({
        class_pass: {
          class_pass_type: true,
        },
        membership: true,
      });

    const accessType = fee.membership
      ? 'membership'
      : (
        fee.class_pass.class_pass_type.pass_type === 'fixed_count'
          ? 'fixed_count_class_pass'
          : 'time_based_class_pass'
      );

    const action = fee.cancelled_at
      ? 'cancelled'
      : 'applied';

    const reason = fee.reason;

    const emailSubjectSettingsKey = `email_${reason}_fee_${action}_${accessType}_subject`;
    const emailBodySettingsKey = `email_${reason}_fee_${action}_${accessType}_body`;

    const settings = await sails.helpers.clientSettings.find(fee.client_id, [
      emailSubjectSettingsKey,
      emailBodySettingsKey,
      'locale',
    ]);

    const emailSubjectTemplate = settings[emailSubjectSettingsKey];
    const emailBodyTemplate = settings[emailBodySettingsKey];

    const [emailSubject, emailBody] = await sails.helpers.string.fillInVariables(
      [emailSubjectTemplate, emailBodyTemplate],
      {
        fee_amount: `${fee.amount} kr`,
        days_deducted: sails.helpers.util.timeIntervalInHumanFormat(fee.days_deducted, 'day', settings.locale),
      },
      {
        customer: fee.user_id,
        studio: fee.client_id,
        class: fee.class_id,
      },
      settings.locale,
    );

    await sails.helpers.email.send.with({
      user: fee.user_id,
      subject: emailSubject,
      text: emailBody,
      emailType: `email_${reason}_fee_${action}_${accessType}`,
    });

    return exits.success();

  },

};
