const ClassPassApi = require('../../services/ClassPassApi');

module.exports = {
  friendlyName: 'Make Reservation',

  description: 'Make Reservation',

  inputs: {
    reservation_id: {
        type: 'string',
        required: true,
    },
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
  },

  exits: {
    forbidden: {
      responseType: 'forbidden',
    },
    makingReservationsFailed: {
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {

    if (!await sails.helpers.can2('controller.IntegrationsClasspassCom.reservations', this.req)) {
      return exits.forbidden();
    }

    const response = await ClassPassApi.post(`/reservations`,
        {
            reservation_id: inputs.reservation_id,
            partner_id: inputs.partner_id,
            venue_id: inputs.venue_id,
            schedule_id: inputs.schedule_id,
            user: this.req.user,
            spot_label: "",
        },
    );

    if (response) {
        return exits.success({
            spot_label: response.spot_label,
        });
    } else {
        return exits.makingReservationsFailed('Making reservations failed');
    }
  },
};
