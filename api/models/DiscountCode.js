/**
 * DiscountCode.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  tableName: 'discount_code',

  attributes: {

    client: {
      model: 'Client',
    },

    name: {
      type: 'string',
    },

    type: {
      type: 'string',
      isIn: ['discount_percent', 'discount_amount', 'membership_campaign'],
    },

    discount_percent: {
      type: 'number'
    },

    discount_amount: {
      type: 'number'
    },

    membership_campaign: {
      model: 'MembershipCampaign'
    },

    valid_for_items: {
      type: 'json',
    },

    has_customer_limit: {
      type: 'boolean',
    },

    customer_limit: {
      type: 'number',
    },

    has_use_per_customer_limit: {
      type: 'boolean',
    },

    use_per_customer_limit: {
      type: 'number'
    },

    active: {
      type: 'Boolean',
    },

  },

}

