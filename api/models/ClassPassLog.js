/**
 * ClassPassLog.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */


module.exports = {

  tableName: 'class_pass_log',

  attributes: {

    client_id: {
      model: 'Client',
    },

    user_id: {
      model: 'User',
    },

    class_pass_id: {
      model: 'ClassPass',
    },

    entry: 'string',

  },

};

