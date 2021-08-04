const ClassPassApi = require('../../services/ClassPassApi');

module.exports = {
  friendlyName: 'Get a Partner',

  description: 'Get a Partner',

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
    partnerNotFound: {
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {

    if (!await sails.helpers.can2('controller.IntegrationsClasspassCom.get-partner', this.req)) {
      return exits.forbidden();
    }
    const partner_id = inputs.id;

    const response = await ClassPassApi.get(`/partners/${partner_id}`);

    if (response) {
        return exits.success({
            partner: response.partner,
        });
    } else {
        return exits.partnerNotFound('Partner not found');
    }
  },
};
