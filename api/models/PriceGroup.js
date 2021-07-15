/**
 * PriceGroup.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  tableName: 'price_group',

  attributes: {

    client: {
      model: 'Client',
    },

    name: 'string',


    membership_types: {
      collection: 'MembershipType',
      via: 'price_groups',
    },

    class_pass_types: {
      collection: 'ClassPassType',
      via: 'price_groups',
    },

    show_in_default_price_list: {
      type: 'boolean',
      defaultsTo: true,
    },

    sort: 'number',

  },
}

