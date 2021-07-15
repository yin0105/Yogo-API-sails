/**
 * ClassEmail.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  tableName: 'class_email',

  attributes: {

    client_id: {
      model: 'Client',
      required: true,
    },

    class_id: {
      model: 'Class',
    },

    sender_id: {
      model: 'User',
      required: true,
    },

    subject: {
      type: 'string',
    },

    body: {
      type: 'string',
      columnType: 'text',
    },

    instances: {
      collection: 'ClassEmailInstance',
      via: 'class_email_id',
    },

    send_at_datetime: {
      type: 'ref',
      columnType: 'datetime',
    },

    send_to_signups: {
      type: 'boolean',
    },

    send_to_waiting_list: {
      type: 'boolean',
    },

    send_to_subsequent_signups: {
      type: 'boolean',
    },

    send_to_livestream_signups: {
      type: 'boolean',
    },

    email_sent: {
      type: 'boolean',
    },

    auto_send_status: {
      type: 'string',
      isIn: ['off', 'active', 'done', 'cancelled'],
    },

    now_processing: {
      type: 'boolean',
      defaultsTo: false,
    },

  },

};

