const knex = require('../../services/knex');
const moment = require('moment-timezone');


const getOrdersData = async (client, startDate, endDate) => {
  startDate = startDate.format("YYYY-MM-DD");
  endDate = endDate.format("YYYY-MM-DD");
  let classes = await 
    knex({o: 'order'})
    .leftJoin({u: 'user'}, 'u.id', 'o.user')
    .innerJoin({oi: 'order_item'}, 'o.id', 'oi.order')
    .where("o.invoice_id", ">=", 0)
    // .andWhere("cs.date", ">=", startDate)
    // .andWhere("cs.date", "<=", endDate)
    .andWhere("o.client", client)
    .select(
      knex.raw('CAST(DATE_ADD("1970-01-01", INTERVAL order.updatedAt/1000 SECOND) AS DATE) AS dd'), 
      knex.raw('order.paid AS paid'),
      knex.raw('order.invoice_id AS invoice_id'),
      knex.raw('order.user AS user_id'),
      knex.raw('order.non_user_name AS non_user_name'),
      knex.raw('order.non_user_email AS non_user_email'),
      knex.raw('CONCAT(user.first_name, user.last_name) AS user_name'), 
      knex.raw('user.email AS user_email'),
      knex.raw('order_item.name AS item_name'),
      knex.raw('order_item.item_type AS item_type'),
      knex.raw('order_item.item_id AS item_id'),
      knex.raw('order_item.count AS item_count'),
      knex.raw('order_item.item_price AS item_price'),
      knex.raw('order_item.total_price AS item_total_price'),
      knex.raw('order_item.vat_amount AS item_vat_amount'),
      knex.raw('order.payment_service_provider AS payment_service_provider'),
      knex.raw('order.pay_type AS pay_type'),
      knex.raw('order.masked_card AS masked_card'),
      knex.raw('order.total AS total'))
    .orderBy('order.paid', 'order.invoice_id');

  for (var i in classes) {
    classes[i]['date'] = moment(classes[i]['date']).format("YYYY-MM-DD");
    classes[i]['signup_count'] = 0;
    classes[i]['checkedin_count'] = 0;
    classes[i]['livestream_signup_count'] = 0;
    for (var j in signups) {
      if (classes[i]['id'] == signups[j]['class']) {
        classes[i]['signup_count'] = signups[j]['signups'];
        break;
      }
    }
    for (var j in checked_ins) {
      if (classes[i]['id'] == checked_ins[j]['class']) {
        classes[i]['checkedin_count'] = checked_ins[j]['checked_ins'];
        break;
      }
    } 
    for (var j in livestream_signups) {
      if (classes[i]['id'] == livestream_signups[j]['class']) {
        classes[i]['livestream_signup_count'] = livestream_signups[j]['livestream_signups'];
        break;
      }
    }   
  }

  return classes;

};

module.exports = {

  friendlyName: 'Orders',

  description: 'Generates the orders report',

  inputs: {
    clientId: {
      type: 'number',
      required: true,
    },

    startDate: {
      type: 'string',
      required: false,
    },

    endDate: {
      type: 'string',
      required: false,
    },

  },

  fn: async (inputs, exits) => {

    const startDate = moment(inputs.startDate, 'YYYY-MM-DD');
    const endDate = moment(inputs.endDate, 'YYYY-MM-DD');
    if (!startDate || !endDate) throw new Error('Orders report: date is invalid.');

    let ordersDataItems = await getOrdersData(
      inputs.clientId,
      startDate,
      endDate,
    );

      ordersData = {
        label: startDate.format('DD.MM.YYYY'),
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD'),
        items: salaryDataItems,
      };

      return exits.success(salaryData);
  },
};
