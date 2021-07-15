module.exports = {
  friendlyName: 'Customers report',

  inputs: {
    format: {
      type: 'string',
      isIn: ['csv'],
    },
    onlyActiveCustomers: {
      type: 'boolean',
    },
    onlyInactiveCustomers: {
      type: 'boolean',
    },
  },

  exits: {
    forbidden: {
      responseType: 'forbidden',
    },
  },


  fn: async function (inputs, exits) {

    if (inputs.format) {
      const fileAction = require('./customers-file');
      return await fileAction(inputs, exits, 'csv', this.req, this.res);
    }

    if (!await sails.helpers.can2('controller.Reports.customers', this.req)) {
      return exits.forbidden();
    }

    const customerdata = await sails.helpers.reports.customers.with({
      client: this.req.client,
      onlyActiveCustomers: inputs.onlyActiveCustomers,
      onlyInactiveCustomers: inputs.onlyInactiveCustomers,
    });

    return exits.success(customerdata);

  },

};
