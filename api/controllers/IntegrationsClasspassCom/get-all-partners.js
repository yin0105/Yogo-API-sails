const ClassPassApi = require('../../services/ClassPassApi');

module.exports = {
  friendlyName: 'List all Partners',

  description: 'Get list of all partners',

  inputs: {
    page: {
      type: 'number',
      required: true,
    },
    page_size: {
        type: 'number',
        required: true,
    },
  },

  exits: {
    forbidden: {
      responseType: 'forbidden',
    },
    listNotFound: {
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {

    if (!await sails.helpers.can2('controller.IntegrationsClasspassCom.get-all-partners', this.req)) {
      return exits.forbidden();
    }

    const page = inputs.page;
    const page_size = inputs.page_size;

    const response = await ClassPassApi.get(`/partners?page=${page}&page_size=${page_size}`);

    if (response) {
        return exits.success({
            partners: response.partners,
            pagination: response.pagination,
        });
    } else {
        return exits.listNotFound('List of all partners not found');
    }
  },
};
