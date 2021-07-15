/**
 * NoShowFee.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  tableName: 'no_show_fee',

  attributes: {

    client_id: {
      model: 'Client',
    },

    user_id: {
      model: 'User',
    },

    class_id: {
      model: 'Class',
    },

    amount: {
      type: 'number',
      defaultsTo: 0,
    },

    days_deducted: {
      type: 'number',
      defaultsTo: 0,
    },

    classes_spent: {
      type: 'number',
      defaultsTo: 0,
    },

    class_signup_id: {
      model: 'ClassSignup',
    },

    reason: {
      type: 'string',
      isIn: ['no_show', 'late_cancel'],
      required: true,
    },

    cancelled_at: {
      type: 'number',
      defaultsTo: 0,
    },

    paid_with_order_id: {
      model: 'Order',
    },

    membership_id: {
      model: 'Membership',
    },

    class_pass_id: {
      model: 'ClassPass'
    }

  },

};

