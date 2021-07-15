const moment = require('moment-timezone');
const OrderObjection = require('../../objection-models/Order')

const VALID_EAGER_POPULATE_FIELDS = [
  'order_items'
];

module.exports = {
  friendlyName: 'Find order(s)',

  inputs: {
    id: {
      type: 'ref',
      required: false,
      description: 'Can be query param (number or array) or route param (/orders/:id, number).',
    },
    periodType: {
      type: 'string',
      required: false,
      isIn: ['year', 'month', 'day', 'custom'],
    },
    year: {
      type: 'string',
      required: false,
    },
    month: {
      type: 'string',
      required: false,
    },
    date: {
      type: 'string',
      required: false,
    },
    startDate: {
      type: 'string',
      required: false,
    },
    endDate: {
      type: 'string',
      required: false,
    },
    populate: {
      type: 'ref',
      required: false
    }
  },

  exits: {
    forbidden: {
      responseType: 'forbidden',
    },
    badRequest: {
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {

    if (!await sails.helpers.can2('controller.Orders.find', this.req)) {
      return exits.forbidden();
    }

    if (!inputs.id && !inputs.periodType) {
      return exits.badRequest('Id(s) or period must be specified.');
    }

    const ordersQuery = OrderObjection.query().alias('o')
      .innerJoin({u: 'user'}, 'o.user', 'u.id')
      .select(
        'o.*',
        'u.first_name AS user_first_name',
        'u.last_name AS user_last_name',
      )
      .where('o.client', this.req.client.id)
      .andWhere('invoice_id', '>', 0);

    if (inputs.id) {
      const ids = _.isArray(inputs.id) ? inputs.id : [inputs.id];
      ordersQuery.andWhere('o.id', 'in', ids);
    }

    switch (inputs.periodType) {
      case 'year':
        ordersQuery.andWhere('paid', '>=', moment.tz(inputs.year + '-01-01', 'Europe/Copenhagen').format('x'))
          .andWhere('paid', '<', moment.tz(inputs.year + '-01-01', 'Europe/Copenhagen').add(1, 'year').format('x'));

        break;
      case 'month':
        const monthStart = moment.tz(inputs.year + '-' + _.padStart(inputs.month, 2, '0') + '-01', 'Europe/Copenhagen');
        ordersQuery.andWhere('paid', '>=', monthStart.format('x'))
          .andWhere('paid', '<', monthStart.add(1, 'month').format('x'));
        break;
      case 'day':
        ordersQuery.andWhere('paid', '>=', moment.tz(inputs.date, 'Europe/Copenhagen').format('x'))
          .andWhere('paid', '<', moment.tz(inputs.date, 'Europe/Copenhagen').add(1, 'day').format('x'));
        break;
      case 'custom':
        ordersQuery.andWhere('paid', '>=', moment.tz(inputs.startDate, 'Europe/Copenhagen').format('x'))
          .andWhere('paid', '<', moment.tz(inputs.endDate, 'Europe/Copenhagen').format('x'));
        break;
    }

    if (inputs.populate) {
      const invalidPopulateFields = _.difference(inputs.populate, VALID_EAGER_POPULATE_FIELDS);
      if (invalidPopulateFields.length) {
        return exits.badRequest('Invalid populate fields: ' + invalidPopulateFields.join(', '))
      }
      ordersQuery.eager(sails.helpers.populate.relationFieldListToEagerLoadConfigObject(inputs.populate))
    }

    const orders = await ordersQuery;

    return exits.success(!inputs.id || _.isArray(inputs.id) ? orders : orders[0]);

  },

};
