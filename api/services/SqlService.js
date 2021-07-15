/**
 * SqlService
 *
 * @description :: Provides Sql utilities
 */


require('require-sql');

module.exports = {

    async nativeQuery(options) {
        const sql = require('../sql/' + options.sqlFile + '.sql');

        const result = await sails.sendNativeQuery(sql, options.params);

        return result.rows
    },

    async getLockedRowForUpdate(options) {
        // Lock the record. Other connections are (I think) not allowed to go past this line then.
        // There needs top be an active transaction for this to work.
        const result = await sails.sendNativeQuery(`SELECT * FROM ${options.table} WHERE id = $1 FOR UPDATE`, [options.rowId])
            .usingConnection(options.dbConnection);

        return result.rows[0];
    },

    async setInvoiceId(options) {
        const clientId = _.isObject(options.client) ? options.client.id : options.client;
        const orderId = _.isObject(options.order) ? options.order.id : options.order;
        await SqlService.nativeQuery({
            sqlFile: 'SqlService/setOrderInvoiceId',
            params: [clientId, orderId]
        });
    }

};
