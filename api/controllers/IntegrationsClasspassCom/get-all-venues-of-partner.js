const ClassPassApi = require('../../services/ClassPassApi');

module.exports = {
  friendlyName: 'List all Venues of a Partner',

  description: 'Get list of all venues of a partner',

  inputs: {
    id: {
      type: 'string',
      required: true,
    },
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

    if (!await sails.helpers.can2('controller.IntegrationsClasspassCom.get-all-venues-of-partner', this.req)) {
      return exits.forbidden();
    }
    const partner_id = inputs.id;
    const page = inputs.page;
    const page_size = inputs.page_size;

    const response = await ClassPassApi.get(`/partners/${partner_id}/venues?page=${page}&page_size=${page_size}`);

    if (response) {
        return exits.success({
            venues: response.venues,
            pagination: response.pagination,
        });
    } else {
        return exits.listNotFound('List of venues of a partner not found');
    }
  },
};
