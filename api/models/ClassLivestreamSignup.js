/**
 * ClassLivestreamSignup.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */


module.exports = {

  tableName: 'class_livestream_signup',

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

    notification_email_sent: {
      type: 'boolean',
      defaultsTo: false
    },

    class_pass_seat_spent: {
      type: 'boolean',
      allowNull: true,
    },

    cancelled_at: {
      type: 'number',
      defaultsTo: 0,
    },

  },

}

