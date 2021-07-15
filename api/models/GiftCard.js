/**
 * GiftCard.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

const moment = require('moment-timezone');

module.exports = {

  tableName: 'gift_card',

  attributes: {

    client_id: {
      model: 'Client',
      required: true,
    },

    code: 'string',

    recipient_email: 'string',
    recipient_name: 'string',

    giver_email: 'string',
    giver_name: 'string',

    message: {
      type: 'string',
      columnType: 'text',
    },

    activated: {
      type: 'boolean',
      defaultsTo: false,
    },

    paid_with_order_id: {
      model: 'Order',
    },

    valid_until: {
      type: 'ref',
      columnType: 'date',
    },

    amount: 'number',

    amount_left: 'number',

    sent_at: 'number',

    sent_by: {
      type: 'string',
      isIn: ['system', 'user'],
    },

    sent_by_user_id: {
      model: 'User',
    },

    log_entries: {
      collection: 'GiftCardLog',
      via: 'gift_card_id'
    }

  },

  customToJSON() {
    this.valid_until = moment(this.valid_until).format('YYYY-MM-DD');

    return this;
  },

};

