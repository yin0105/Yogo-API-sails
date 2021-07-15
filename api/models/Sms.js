/**
 * Sms.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */


module.exports = {

  attributes: {

    client: {
      model: 'Client',
    },

    user: {
      model: 'User',
    },

    message: {
      type: 'string',
      columnType: 'text',
    },

    msisdn: {
      type: 'string',
    },

    type: {
      type: 'string',
      isIn: [
        'class_cancelled',
        'customer_moved_from_waiting_list_to_class',
        'teacher_notification_customer_signed_up_for_private_class',
        'teacher_notification_customer_signed_off_fron_private_class',
      ],
    },

    sms_provider_id: {
      type: 'string',
    },

    sms_provider_total_cost: {
      type: 'number',
    },

    sms_provider_currency: {
      type: 'string',
    },

    sms_provider_status: {
      type: 'string',
    },

    sms_provider_status_time: {
      type: 'number',
    },

  },

}

