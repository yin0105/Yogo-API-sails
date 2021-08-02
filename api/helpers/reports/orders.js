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
            knex.raw('CAST(DATE_ADD("1970-01-01", INTERVAL o.updatedAt/1000 SECOND) AS DATE) AS dd'), 
            knex.raw('o.paid AS paid'),
            knex.raw('o.invoice_id AS invoice_id'),
            knex.raw('o.user AS user_id'),
            knex.raw('o.non_user_name AS non_user_name'),
            knex.raw('o.non_user_email AS non_user_email'),
            knex.raw('CONCAT(u.first_name, u.last_name) AS user_name'), 
            knex.raw('u.email AS user_email'),
            knex.raw('oi.name AS item_name'),
            knex.raw('oi.item_type AS item_type'),
            knex.raw('oi.item_id AS item_id'),
            knex.raw('oi.count AS item_count'),
            knex.raw('oi.item_price AS item_price'),
            knex.raw('oi.total_price AS item_total_price'),
            knex.raw('oi.vat_amount AS item_vat_amount'),
            knex.raw('o.payment_service_provider AS payment_service_provider'),
            knex.raw('o.pay_type AS pay_type'),
            knex.raw('o.masked_card AS masked_card'),
            knex.raw('o.total AS total'))
        .orderBy('o.paid', 'o.invoice_id');

    //   for (var i in classes) {
    //     classes[i]['date'] = moment(classes[i]['date']).format("YYYY-MM-DD");
    //     classes[i]['signup_count'] = 0;
    //     classes[i]['checkedin_count'] = 0;
    //     classes[i]['livestream_signup_count'] = 0;
    //     for (var j in signups) {
    //       if (classes[i]['id'] == signups[j]['class']) {
    //         classes[i]['signup_count'] = signups[j]['signups'];
    //         break;
    //       }
    //     }
    //     for (var j in checked_ins) {
    //       if (classes[i]['id'] == checked_ins[j]['class']) {
    //         classes[i]['checkedin_count'] = checked_ins[j]['checked_ins'];
    //         break;
    //       }
    //     } 
    //     for (var j in livestream_signups) {
    //       if (classes[i]['id'] == livestream_signups[j]['class']) {
    //         classes[i]['livestream_signup_count'] = livestream_signups[j]['livestream_signups'];
    //         break;
    //       }
    //     }   
    //   }

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
            items: ordersDataItems,
        };

        return exits.success(ordersData);
    },
};
