const ClassPassApi = require('../../services/ClassPassApi');

module.exports = {
  friendlyName: 'Attendance',

  description: 'Attendance',

  inputs: {
    partner_id: {
        type: 'string',
        required: true,
    },
    venue_id: {
        type: 'string',
        required: true,
    },
    schedule_id: {
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
    attendanceFailed: {
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {

    if (!await sails.helpers.can2('controller.IntegrationsClasspassCom.attendance', this.req)) {
      return exits.forbidden();
    }

    const partner_id = inputs.partner_id;
    const venue_id = inputs.venue_id;
    const schedule_id = inputs.schedule_id;
    const page = inputs.page;
    const page_size = inputs.page_size;

    const response = await ClassPassApi.put(`/partners/${partner_id}/venues/${venue_id}/schedules/${schedule_id}/attendance?page=${page}&page_size=${page_size}`);

    if (response) {
        return exits.success({
            attendance: response.attendance,
            pagination: response.pagination,
        });
    } else {
        return exits.attendanceFailed('Attendance failed');
    }
  },
};
