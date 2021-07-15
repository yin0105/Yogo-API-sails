/**
 * EventGroup.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

    tableName: 'event_group',

    attributes: {

        client: {
            model: 'Client'
        },

        name: 'string',

        description: {
            type: 'string',
            columnType: 'text'
        },

        teachers: {
            collection: 'User',
            via: 'teaching_event_groups'
        },

        price: 'number',

        image: {
            model: 'Image'
        },

        events: {
            collection: 'Event',
            via: 'event_group'
        },

        color: {
            type: 'string',
            defaultsTo: '#000',
            allowNull: true
        },

        sort: 'number'


    }
};

