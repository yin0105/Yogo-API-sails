const ClassPassApi = require('../../services/ClassPassApi');

module.exports = {
  friendlyName: 'Cancel Reservation',

  description: 'Cancel a reservation',

  inputs: {
    reservation_id: {
        type: 'string',
        required: true,
    },
    partner_id: {
        type: 'string',
        required: true,
    },
    is_late_cancel: {
        type: 'boolean',
        required: false,
    },
  },

  exits: {
    forbidden: {
      responseType: 'forbidden',
    },
    CancellingReservationsFailed: {
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {

    if (!await sails.helpers.can2('controller.IntegrationsClasspassCom.cancel-reservation', this.req)) {
      return exits.forbidden();
    }

    const reservation_id = inputs.reservation_id;
    const partner_id = inputs.partner_id;
    const req_body = inputs.is_late_cancel? 
        {
            is_late_cancel: is_late_cancel, 
            partner_id: partner_id
        } : {
            partner_id: partner_id
        }
    const response = await ClassPassApi.put(`/reservations/${reservation_id}`, req_body);

    if (response) {
        return exits.success({
            is_late_cancel: response.is_late_cancel,
        });
    } else {
        return exits.CancellingReservationsFailed('Cancelling reservations failed');
    }
  },
};
