module.exports = {
  friendlyName: 'Populate receipt link',

  inputs: {
    orders: {
      type: 'ref',
      description: 'The orders to populate',
      required: true
    }
  },

  fn: async function(inputs, exits) {

    if (!inputs.orders.length) {
      return exits.success([])
    }

    // Already populated??
    if (typeof inputs.orders[0].receipt_link !== 'undefined') {
      return exits.success(inputs.orders)
    }

    _.each(inputs.orders, order => {
      if (!order.receipt_token) {
        order.receipt_link = null
      }
      order.receipt_link = sails.config.baseUrl + '/orders/' + order.id + '/pdf-receipt?receiptToken=' + order.receipt_token
    })

    return exits.success(inputs.orders)

  }
}
