/**
 * EventTimeSlot.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

const moment = require('moment')

module.exports = {

    tableName: 'event_time_slot',

    attributes: {

        client: {
            model: 'Client'
        },

        event: {
            model: 'Event'
        },

        date: {
            type: 'ref',
            columnType: 'date'
        },

        start_time: {
            type: 'ref',
            columnType: 'time'
        },

        end_time: {
            type: 'ref',
            columnType: 'time'
        }

    },

    customToJSON() {
        this.start_time = this.start_time.substr(0, 5)
        this.end_time = this.end_time.substr(0, 5)

        this.date = moment(this.date).format('YYYY-MM-DD')

        return this
    },
};

