/**
 * Order.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

const md5 = require('md5')

module.exports = {

  attributes: {

    client: {
      model: 'Client',
    },

    user: {
      model: 'User',
    },

    non_user_email: {
      type: 'string'
    },

    non_user_name: {
      type: 'string',
    },

    order_items: {
      collection: 'OrderItem',
      via: 'order',
    },

    total: 'number',

    vat_amount: 'number',

    payment_service_provider: {
      type: 'string',
      isIn: ['dibs', 'reepay', 'reepay_onboarding', 'stripe', 'stripe_onboarding'],
    },

    payment_provider_order_id: 'string',

    subscription_created: {
      type: 'number',
      defaultsTo: 0,
    },

    paid: {
      type: 'number',
      defaultsTo: 0,
    },

    system_updated: {
      type: 'number',
      defaultsTo: 0,
    },

    receipt_sent: {
      type: 'number',
      defaultsTo: 0,
    },

    payment_failed: {
      type: 'number',
      defaultsTo: 0,
    },

    transaction_id: {
      type: 'string',
    },

    transaction_fee: {
      type: 'number',
    },

    pay_type: {
      type: 'string',
      defaultsTo: '',
    },

    card_prefix: {
      type: 'string',
      defaultsTo: '',
    },

    card_last_4_digits: {
      type: 'string',
      defaultsTo: '',
    },

    card_expires: {
      type: 'string',
      defaultsTo: '',
    },

    card_expiration: {
      type: 'string',
      defaultsTo: '',
    },

    masked_card: {
      type: 'string',
      defaultsTo: '',
    },

    gateway_statuscode: {
      type: 'string',
      defaultsTo: '',
    },

    test: 'boolean',

    payment_subscription: {
      model: 'PaymentSubscription',
    },

    membership: {
      model: 'Membership',
    },

    invoice_id: 'number',

    receipt_token: 'string',

  },

  populateProducts: async function (order) {

    if (!order.order_items) return new Error('Missing order items')

    await Promise.all(order.order_items.map(async (order_item) => {
      switch (order_item.item_type) {
        case 'membership_type':
          order_item.product = await MembershipType.findOne(order_item.item_id)
          break
        case 'class_pass_type':
          order_item.product = await ClassPassType.findOne(order_item.item_id)
          break
        case 'event':
          order_item.product = await Event.findOne(order_item.item_id)
          break
        case 'product':
          order_item.product = await Product.findOne(order_item.item_id)
          break
        case 'discount_code':
          order_item.product = await DiscountCode.findOne(order_item.item_id)
          break
      }
    }))

    return order

  },


  getOrderTotal: async function (order) {

    if (!_.isObject(order) || !order.order_items) {
      order = await Order.findOne(_.isObject(order) ? order.id : order).populate('order_items')
    }

    if (!order) reject('Could not find order')

    order = await Order.populateProducts(order)

    let orderTotal = 0
    await Promise.all(order.order_items.map(async (order_item) => {

      if (order_item.item_type === 'membership_type') {

        if (!_.isObject(order_item.payment_option)) {
          order_item.payment_option = await MembershipTypePaymentOption.findOne(order_item.payment_option)
        }
        orderTotal += parseFloat(order_item.payment_option.payment_amount)

      } else if (order_item.item_type === 'discount_code') {
        //orderTotal += await sails.helpers.cart.calculateDiscountCodeInCartPrice()
      } else {
        orderTotal += parseFloat(order_item.product.price)
      }

    }))

    return orderTotal
  },


  calculateDibsRequestMd5Key: async function (order) {

    if (!_.isObject(order)) order = await Order.findOne(order)

    if (!order) throw new Error('Could not find order')

    const client = _.isObject(order.client) ? order.client : await Client.findOne(order.client)


    if (!client) throw new Error('Could not find client')


    let dibsClientData = await DibsClientData.find({client: client.id})

    if (!dibsClientData) throw new Error('Could not find client confidential data')

    dibsClientData = dibsClientData[0]

    const orderTotal = await Order.getOrderTotal(order.id)


    let parameter_string = ''
    parameter_string += 'merchant=' + client.dibs_merchant

    parameter_string += '&orderid=' + (order.payment_provider_order_id ? order.payment_provider_order_id : order.id)

    parameter_string += '&currency=208'

    parameter_string += '&amount=' + orderTotal * 100

    return md5(dibsClientData.md5_key_2 + md5(dibsClientData.md5_key_1 + parameter_string))

  },


  async applyItemsToCustomer(order) {

    if (!_.isObject(order) || !order.order_items) {
      order = await Order.findOne({id: _.isObject(order) ? order.id : order}).populate('order_items')
    }

    await Promise.all(order.order_items.map(async (orderItem) => {
      switch (orderItem.item_type) {
        case 'membership_type':
          if (orderItem.payment_option) {
            orderItem.payment_option = await MembershipTypePaymentOption.findOne(orderItem.payment_option)
          }
          const membership = await MembershipType.applyToCustomer(orderItem.item_id, orderItem.payment_option, order.user, order.id)
          await MembershipLog.log(membership, 'Medlemskab købt af kunden. Betalingsperiode: ' + orderItem.payment_option.name)
          break
        case 'class_pass_type':
          await ClassPassType.applyToCustomer(orderItem.item_id, order.user, order.id)
          break
        case 'event':
          await Event.signUpUser(orderItem.item_id, order.user, order.client)
          break
      }
    }))


  },

}

