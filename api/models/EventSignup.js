/**
 * EventSignup.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

    tableName: 'event_signup',

    attributes: {

        client: {
            model: 'Client'
        },

        user : {
            model : 'User'
        },

        event : {
            model : 'Event'
        }

    }
};

