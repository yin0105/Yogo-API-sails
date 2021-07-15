/**
 * ClassEmailInstance.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  tableName: 'class_email_instance',

  attributes: {

    client_id: {
      model: 'Client',
      required: true,
    },

    class_email_id: {
      model: 'ClassEmail',
    },

    recipient_id: {
      model: 'User',
    },

    email_provider_status: {
      type: 'string',
    },

  },

};

