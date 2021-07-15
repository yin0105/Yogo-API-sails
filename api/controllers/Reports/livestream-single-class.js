module.exports = {
  friendlyName: 'Livestream usage report',

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

    if (!await sails.helpers.can2('controller.Reports.livestream-single-class', this.req, inputs)) {
      return exits.forbidden();
    }

    const livestreamData = await sails.helpers.reports.livestreamSingleClass.with({
      class: inputs.id,
    });

    return exits.success(livestreamData);

  },

};
