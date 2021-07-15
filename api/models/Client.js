/**
 * Client.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    name: 'string',

    address_1: 'string',
    address_2: 'string',
    zip_code: 'string',
    city: 'string',
    country: 'string',
    phone: 'string',
    email: {
      type: 'string',
      isEmail: true,
      required: true,
    },
    website: {
      type: 'string',
      isURL: true,
    },

    sms_sender_name: 'string',

    vat_number: 'string',

    logo: {
      model: 'Image',
    },

    logo_white: {
      model: 'Image',
    },

    terms: {
      type: 'string',
      columnType: 'text',
    },

    dibs_merchant: 'string',

    class_signoff_deadline_minutes: {
      type: 'number',
      defaultsTo: 720, // 12 hours
    },

    branches: {
      collection: 'Branch',
      via: 'client',
    },

    plan: {
      type: 'string',
      isIn: ['light', 'studio', 'app'],
    },

    extended_video_enabled: {
      type: 'boolean',
      defaultsTo: false
    },

  },

};

