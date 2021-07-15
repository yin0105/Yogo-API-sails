/**
 * EmailLog.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */


module.exports = {

  tableName: 'email_log',

  attributes: {

    client_id: {
      model: 'Client',
    },

    user_id: {
      model: 'User',
    },

    class_id: {
      model: 'Class'
    },

    class_email_id: {
      model: 'ClassEmail'
    },

    class_type_email_id: {
      model: 'ClassTypeEmail'
    },

    from: 'string',

    to: 'string',

    bcc: 'string',

    subject: 'string',

    text: {
      type: 'string',
      columnType: 'text',
    },

    html: {
      type: 'string',
      columnType: 'text',
    },

    attachments: 'string',

    email_type: 'string',

    email_provider_id: 'string',

    email_provider_status: 'string',

  },

};

