/**
 * GiftCardLog.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  tableName: 'gift_card_log',

  attributes: {

    client_id: {
      model: 'Client',
      required: true,
    },

    gift_card_id: {
      model: 'GiftCard',
    },

    entry: {
      type: 'string',
      columnType: 'text',
    },

  },

};

