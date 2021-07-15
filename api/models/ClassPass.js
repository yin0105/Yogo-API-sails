/**
 * ClassPass.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

const moment = require('moment')

module.exports = {

    tableName: 'class_pass',

    attributes: {

        client: {
            model: 'Client'
        },

        user: {
            model: 'User'
        },

        order: {
            model: 'Order'
        },

        class_pass_type: {
            model: 'ClassPassType'
        },


        classes_left: {
            type: 'number'
        },

        start_date: {
            type: 'ref',
            columnType: 'date'
        },

        valid_until: {
            type: 'ref',
            columnType: 'date'
        },

        log_entries: {
            collection: 'ClassPassLog',
            via: 'class_pass_id',
        },

        ad_hoc_task_status: 'string'

    },

    customToJSON() {
        this.start_date = moment(this.start_date).format('YYYY-MM-DD')
        this.valid_until = moment(this.valid_until).format('YYYY-MM-DD')

        return this
    },

};

