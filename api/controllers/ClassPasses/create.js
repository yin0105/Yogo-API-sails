module.exports = {
  friendlyName: 'Create class pass',

  description: 'Most class passes are created after a payment. This endpoint is for admins and for free class passes',

  inputs: {
    class_pass_type: {
      type: 'number',
      required: true,
    },
    user: {
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

    if (!await sails.helpers.can2('controller.ClassPasses.create', this.req)) {
      return exits.forbidden();
    }

    const newClassPass = await sails.helpers.classPassType.applyToCustomer(inputs.class_pass_type, inputs.user);

    const locale = await sails.helpers.clientSettings.find(newClassPass.client_id || newClassPass.client, 'locale');
    const validUntilFormatted = sails.helpers.util.formatDate(newClassPass.valid_until, locale);
    const classPassType = await ClassPassType.findOne(inputs.class_pass_type);
    const userType = this.req.authorizedRequestContext === 'admin'
      ? sails.helpers.t('userType.admin')
      : sails.helpers.t('userType.theCustomer');
    let logEntry;
    if (classPassType.pass_type === 'fixed_count') {
      logEntry = sails.helpers.t(
        'classPassLog.classPassCreatedByUserTypeValidUntilClassesLeft',
        [userType, validUntilFormatted, newClassPass.classes_left],
      );
    } else {
      logEntry = sails.helpers.t('classPassLog.classPassCreatedByUserTypeValidUntil', [userType, validUntilFormatted]);
    }
    if (this.req.authorizedRequestContext === 'admin') {
      logEntry += ` ${sails.helpers.t('global.User')}: ${this.req.user.first_name} ${this.req.user.last_name} (ID ${this.req.user.id}).`;
    }
    await sails.helpers.classPassLog.log(newClassPass, logEntry);

    return exits.success(newClassPass);
  },
};
