/**
 * ClientSettings.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  tableName: 'client_settings',

  attributes: {

    client: {
      model: 'Client',
    },

    key: 'string',

    value: {
      type: 'string',
      columnType: 'text'
    },

    secret: 'boolean',

  },

}

