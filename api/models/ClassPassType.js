
/**
 * ClassPassType.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

//const moment = require('moment')

module.exports = {

  tableName: 'class_pass_type',

  attributes: {

    client: {
      model: 'Client',
    },

    name: {
      type: 'string',
    },

    description: {
      type: 'string',
      columnType: 'text',
    },

    image: {
      model: 'Image',
    },

    pass_type: {
      type: 'string',
      isIn: ['unlimited', 'fixed_count'],
    },

    number_of_classes: {
      type: 'number',
    },

    days: 'number',

    class_types: {
      collection: 'ClassType',
      via: 'class_pass_types',
    },

    has_max_number_of_simultaneous_bookings: {
      type: 'boolean',
      defaultsTo: false
    },

    max_number_of_simultaneous_bookings: {
      type: 'number',
      defaultsTo: 10
    },

    price: 'number',

    for_sale: 'boolean',

    price_groups: {
      collection: 'PriceGroup',
      via: 'class_pass_types',
    },

    send_email_to_customer: 'boolean',

    email_subject: 'string',

    email_body: {
      type: 'string',
      columnType: 'text',
    },

    limited_number_per_customer: {
      type: 'boolean',
      defaultsTo: false,
    },

    max_number_per_customer: {
      type: 'number',
      defaultsTo: 1,
    },

    video_groups: {
      collection: 'VideoGroup',
      via: 'class_pass_types'
    },

    class_types_livestream: {
      collection: 'ClassType',
      via: 'class_pass_type',
      through: 'ClassPassTypeClassTypeLivestream'
    },

    access_all_videos: {
      type: 'boolean',
      defaultsTo: false
    }

  },


  /*applyToCustomer: async function (classPassTypeId, userId, orderId) {

    let classPassType = await ClassPassType.findOne(classPassTypeId).populate('class_types')

    if (!classPassType) throw new Error('Class Pass type not available')

    let today = moment().startOf('day')
    let classPassData = {
      client: classPassType.client,
      user: userId,
      order: orderId,
      class_pass_type: classPassType.id,
      classes_left: classPassType.number_of_classes,
      start_date: today.format('YYYY-MM-DD'),
      valid_until: today.add(classPassType.days, 'days').format('YYYY-MM-DD'),
    }


    let classPass = await ClassPass.create(classPassData).fetch()
    if (!classPass) {
      throw new Error('Could not create class pass!')
    }

    if (classPassType.send_email_to_customer) {
      await sails.helpers.email.customer.yourNewClassPass(classPass)
    }

    return classPass

  },*/
}

