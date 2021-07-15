/**
 * OrderLine.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  tableName: 'order_item',

  attributes: {

    client: {
      model: 'Client',
    },

    order: {
      model: 'Order',
    },

    item_type: {
      type: 'string',
      isIn: ['membership_type', 'class_pass_type', 'event', 'membership_renewal', 'membership_no_show_fee', 'membership_pause_fee', 'product', 'discount_code', 'gift_card_purchase', 'gift_card_spend'],
    },

    item_id: 'number',

    name: 'string',

    count: 'number',

    item_price: 'number',

    total_price: 'number',

    vat_amount: 'number',

    applied_discount_code_amount: 'number',

    payment_option: {
      model: 'MembershipTypePaymentOption',
    },

    membership_campaign: {
      model: 'MembershipCampaign'
    },

    membership_renewal_membership_type: {
      model: 'MembershipType'
    }

  },

  populatePaymentOption: function (orderItem, cb) {
    // If already populated
    if (_.isObject(orderItem.paymentOption)) cb(orderItem)

    // If not set
    if (!orderItem.paymentOption) cb(orderItem)

    OrderItem.findOne(orderItem.paymentOption)
      .then((paymentOption) => {
        orderItem.payment_option = paymentOption
        cb(orderItem)
      })
      .catch(cb(err))

  },
}

