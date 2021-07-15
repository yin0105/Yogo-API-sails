module.exports = {
  friendlyName: 'Livestream usage report',

  inputs: {
    startDate: {
      type: 'string',
      required: true,
      custom: sd => sd.match(/^\d\d\d\d-\d\d-\d\d$/),
    },

    endDate: {
      type: 'string',
      required: false,
      custom: ed => ed.match(/^\d\d\d\d-\d\d-\d\d$/),
    },
  },

  exits: {
    forbidden: {
      responseType: 'forbidden',
    },
    dateIntervalTooLong: {
      responseType: 'badRequest',
    },
  },


  fn: async function (inputs, exits) {

    if (!await sails.helpers.can2('controller.Reports.livestream', this.req)) {
      return exits.forbidden();
    }

    const startDate = inputs.startDate < '2021-02-12'
      ? '2021-02-12'
      : inputs.startDate;

    const livestreamData = await sails.helpers.reports.livestream.with({
      startDate: startDate,
      endDate: inputs.endDate ? inputs.endDate : startDate,
      client: this.req.client,
    })
      .tolerate('dateIntervalTooLong', () => {
        exits.dateIntervalTooLong('Date interval too long');
        return null;
      });

    if (livestreamData === null) return;

    return exits.success(livestreamData);

  },

};
