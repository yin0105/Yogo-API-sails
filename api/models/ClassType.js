/**
 * ClassType.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

const validator = require('validator')
const ValidationError = require('../errors/ValidationError')

module.exports = {

  tableName: 'class_type',

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

    class_pass_types: {
      collection: 'ClassPassType',
      via: 'class_types',
    },

    class_pass_types_livestream: {
      collection: 'ClassPassType',
      via: 'class_type',
      through: 'ClassPassTypeClassTypeLivestream'
    },

    membership_types: {
      collection: 'MembershipType',
      via: 'class_types',
    },

    membership_types_livestream: {
      collection: 'MembershipType',
      via: 'class_type',
      through: 'MembershipTypeClassTypeLivestream'
    },

    color: {
      type: 'string',
      defaultsTo: '#12169C',
    },

    class_type_emails: {
      collection: 'ClassTypeEmail',
      via: 'class_type_id',
      through: 'ClassTypeEmailClassType'
    }

  },

}

