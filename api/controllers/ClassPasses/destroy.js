module.exports = {
  friendlyName: 'Destroy class pass',

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

    if (!await sails.helpers.can2('controller.ClassPasses.destroy', this.req, inputs)) {
      return exits.forbidden();
    }

    await ClassPass.update({id: inputs.id}, {archived: true});

    let logEntry = sails.helpers.t('classPassLog.classPassDeletedByAdmin');
    logEntry += ` ${sails.helpers.t('global.User')}: ${this.req.user.first_name} ${this.req.user.last_name} (ID ${this.req.user.id})`;
    await sails.helpers.classPassLog.log(inputs.id, logEntry);

    return exits.success();

  },

};
