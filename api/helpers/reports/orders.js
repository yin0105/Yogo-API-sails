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
      knex.raw("cs.id AS id"), 
      knex.raw("cs.date AS date"), 
      knex.raw("CONCAT(LEFT(start_time,5), '-',  LEFT(end_time, 5)) AS time"), 
      knex.raw("ctype.name as class"),
      knex.raw("TIMEDIFF(end_time, start_time) AS duration"),
      knex.raw("r.name as room"),
      knex.raw("u.id as teacher_id"),
      knex.raw("CONCAT(u.first_name, ' ', u.last_name) as teacher_name"));

  let signups = await 
    knex({cs: 'class_signup'})
    .where({
      'cancelled_at': 0,
    })
    .select(
      'class', 
      knex.raw("COUNT(id) as signups"))
    .groupBy('class');

  let checked_ins = await 
    knex({cs: 'class_signup'})
    .where({
      'cancelled_at': 0,
      'checked_in': 1
    })
    .select(
      'class', 
      knex.raw("COUNT(id) as checked_ins"))
    .groupBy('class');

  let livestream_signups = await 
    knex({cs: 'class_livestream_signup'})
    .where({
      'cancelled_at': 0,
    })
    .select(
      'class', 
      knex.raw("COUNT(id) as livestream_signups"))
    .groupBy('class');
  
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
