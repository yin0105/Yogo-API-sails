/**
 * ClassTypeEmail.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  tableName: 'class_type_email',

  attributes: {

    client_id: {
      model: 'Client',
      required: true,
    },

    class_types: {
      collection: 'ClassType',
      via: 'class_type_email_id',
      through: 'ClassTypeEmailClassType'
    },

    subject: {
      type: 'string',
    },

    body: {
      type: 'string',
      columnType: 'text',
    },

    send_at: {
      type: 'string',
      isIn: ['signup', 'cancel_booking', 'minutes_before_class']
    },

    send_to_signups: {
      type: 'boolean',
    },

    send_to_livestream_signups: {
      type: 'boolean',
    },

    send_to_waiting_list: {
      type: 'boolean',
    },

    minutes_before_class: {
      type: 'number',
    },

    send_to_subsequent_signups: {
      type: 'boolean',
    },

  },

};

