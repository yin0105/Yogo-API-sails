module.exports = {
  friendlyName: 'Update class pass',

  inputs: {
    id: {
      type: 'number',
      required: true,
    },
    valid_until: {
      type: 'string',
      custom: d => d.match(/^\d\d\d\d-\d\d-\d\d$/),
    },
    classes_left: {
      type: 'number',
    },
  },

  exits: {
    forbidden: {
      responseType: 'forbidden',
    },
  },

  fn: async function (inputs, exits) {

    if (!await sails.helpers.can2('controller.ClassPasses.update', this.req, inputs)) {
      return exits.forbidden();
    }

    const existingClassPass = await ClassPass.findOne(inputs.id);

    let classPassData = _.pick(inputs, [
      'classes_left',
      'valid_until',
    ]);

    const [updatedClassPass] = await ClassPass.update({id: inputs.id}, classPassData).fetch();

    const locale = await sails.helpers.clientSettings.find(existingClassPass.client, 'locale');
    const previouslyValidUntilFormatted = sails.helpers.util.formatDate(existingClassPass.valid_until, locale);
    const validUntilFormatted = sails.helpers.util.formatDate(updatedClassPass.valid_until, locale);
    const classPassType = await ClassPassType.findOne(existingClassPass.class_pass_type);
    let logEntry;
    if (classPassType.pass_type === 'fixed_count') {
      logEntry = sails.helpers.t(
        'classPassLog.classPassFixedUpdatedByAdmin',
        [previouslyValidUntilFormatted,
          existingClassPass.classes_left,
          validUntilFormatted,
          updatedClassPass.classes_left,
        ],
      );
    } else {
      logEntry = sails.helpers.t(
        'classPassLog.classPassUnlimitedUpdatedByAdmin',
        [previouslyValidUntilFormatted, validUntilFormatted],
      );
    }
    logEntry += ` ${sails.helpers.t('global.User')}: ${this.req.user.first_name} ${this.req.user.last_name} (ID ${this.req.user.id}).`;
    await sails.helpers.classPassLog.log(updatedClassPass, logEntry);

    return exits.success(updatedClassPass);
  },

};
