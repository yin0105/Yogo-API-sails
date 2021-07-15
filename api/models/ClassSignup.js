/**
 * ClassSignup.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */


module.exports = {

  tableName: 'class_signup',

  attributes: {

    client: {
      model: 'Client',
    },

    user: {
      model: 'User',
    },

    class: {
      model: 'Class',
    },

    used_membership: {
      model: 'Membership',
    },

    used_class_pass: {
      model: 'ClassPass',
    },

    class_pass_seat_spent: {
      type: 'boolean',
      allowNull: true,
    },

    cancelled_at: {
      type: 'number',
      defaultsTo: 0,
    },

    checked_in: {
      type: 'number',
      defaultsTo: 0,
    },

    no_show_fee_applied: {
      type: 'boolean',
      defaultsTo: false,
    }

  },

};

