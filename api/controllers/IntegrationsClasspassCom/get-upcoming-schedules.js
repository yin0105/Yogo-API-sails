const ClassPassApi = require('../../services/ClassPassApi');

module.exports = {
  friendlyName: 'Upcoming Schedules',

  description: 'Get upcoming schedules',

  inputs: {
    partner_id: {
      type: 'string',
      required: true,
    },
    venue_id: {
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
    upcomingSchedulesNotFound: {
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {

    if (!await sails.helpers.can2('controller.IntegrationsClasspassCom.get-upcoming-schedules', this.req)) {
      return exits.forbidden();
    }
    const partner_id = inputs.partner_id;
    const venue_id = inputs.venue_id;
    const page = inputs.page;
    const page_size = inputs.page_size;

    const response = await ClassPassApi.get(`/partners/${partner_id}/venues/${venue_id}/schedules?page=${page}&page_size=${page_size}`);

    if (response) {
        return exits.success({
            schedules: response.schedules,
            pagination: response.pagination,
        });
    } else {
        return exits.upcomingSchedulesNotFound('Upcoming schedules not found');
    }
  },
};
