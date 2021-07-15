/**
 * MembershipPause.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

const moment = require('moment-timezone');

module.exports = {

  tableName: 'membership_pause',

  attributes: {

    client_id: {
      model: 'Client',
      required: true,
    },

    membership_id: {
      model: 'Membership',
      required: true,
    },

    start_date: {
      type: 'ref',
      columnType: 'date',
      required: true,
    },

    // The date the membership starts again
    end_date: {
      type: 'ref',
      columnType: 'date',
    },

    fee: {
      type: 'number',
      defaultsTo: 0,
    },

    fee_paid_with_order_id: {
      model: 'Order',
    },

    comment: {
      type: 'string',
    },

    is_applied_to_membership_at: {
      type: 'number',
      defaultsTo: 0,
    },

  },

  customToJSON() {
    this.start_date = moment(this.start_date).format('YYYY-MM-DD');
    if (this.end_date) {
      this.end_date = moment(this.end_date).format('YYYY-MM-DD');
    }
    return this
  },

};

