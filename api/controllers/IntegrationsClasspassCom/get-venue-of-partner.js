const ClassPassApi = require('../../services/ClassPassApi');

module.exports = {
  friendlyName: 'A venue of a Partner',

  description: 'Get a venue of a partner',

  inputs: {
    partner_id: {
      type: 'string',
      required: true,
    },
    venue_id: {
        type: 'string',
        required: true,
    },
  },

  exits: {
    forbidden: {
      responseType: 'forbidden',
    },
    venueNotFound: {
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {

    if (!await sails.helpers.can2('controller.IntegrationsClasspassCom.get-venue-of-partner', this.req)) {
      return exits.forbidden();
    }
    const partner_id = inputs.partner_id;
    const venue_id = inputs.venue_id;

    const response = await ClassPassApi.get(`/partners/${partner_id}/venues/${venue_id}`);

    if (response) {
        return exits.success({
            venue: response.venue,
        });
    } else {
        return exits.venueNotFound('A venue of a partner not found');
    }
  },
};
