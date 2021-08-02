const knex = require('../../services/knex');
const moment = require('moment-timezone');


const getOrdersData = async (client, startDate, endDate) => {
    startDate = startDate.format("YYYY-MM-DD");
    endDate = endDate.format("YYYY-MM-DD");
    let orders = await 
        knex({o: 'order'})
        .leftJoin({u: 'user'}, 'u.id', 'o.user')
        .innerJoin({oi: 'order_item'}, 'o.id', 'oi.order')
        .select(
            knex.raw('CAST(DATE_ADD("1970-01-01", INTERVAL o.paid/1000 SECOND) AS DATE) AS paid'), 
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
        .where("o.invoice_id", ">", 0)
        .andWhereRaw('CAST(DATE_ADD("1970-01-01", INTERVAL o.updatedAt/1000 SECOND) AS DATE) >= ?', [startDate])
        .andWhereRaw('CAST(DATE_ADD("1970-01-01", INTERVAL o.updatedAt/1000 SECOND) AS DATE) <=?', [endDate])
        .andWhere("o.client", client)        
        .orderBy('o.paid', 'o.invoice_id');

    for (var i in orders) {
        if ( !orders[i]['user_id'] ) {
            orders[i]['user_name'] = orders[i]['non_user_name']
            orders[i]['user_email'] = orders[i]['non_user_email']
        }
    }

    return orders;

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
