const knex = require('../../../services/knex');

module.exports = {
  friendlyName: 'Populate user invoices',

  inputs: {
    users: {
      type: 'ref',
      required: true,
    },
  },

  fn: async (inputs, exits) => {

    if (!inputs.users.length) {
      return exits.success([]);
    }

    if (typeof inputs.users[0].invoices !== 'undefined') {
      return exits.success();
    }

    const allInvoices = await knex({o: 'order'})
      .where('user', 'in', _.map(inputs.users, 'id'))
      .andWhere('invoice_id', '>', 0)
      .andWhere({
        archived: 0,
      });

    console.log(allInvoices)

    for (let i = 0; i < inputs.users.length; i++) {

      const user = inputs.users[i];

      user.invoices = _.filter(allInvoices, {user: user.id});

    }

    return exits.success();

  },
};
