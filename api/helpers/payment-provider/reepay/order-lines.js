module.exports = {
  friendlyName: 'Make order lines for Reepay session from order or order items',

  inputs: {
    order: {
      type: 'ref',
      required: false,
    },
    orderItems: {
      type: 'ref',
      required: false,
    },
  },

  exits: {
    orderOrOrderItemsMustBeProvided: {},
  },

  fn: async (inputs, exits) => {

    if (!inputs.order && !inputs.orderItems) {
      throw 'orderOrOrderItemsMustBeProvided'
    }

    let orderItems
    if (inputs.orderItems) {
      orderItems = inputs.orderItems
    } else {
      const orderId = sails.helpers.util.idOrObjectIdInteger(inputs.order)
      const order = await Order.findOne(orderId).populate('order_items')
      orderItems = order.order_items
    }

    const orderLines = _.map(orderItems, orderItem => ({
        ordertext: orderItem.name,
        amount: orderItem.item_price * 100,
        vat: orderItem.vat_amount / (orderItem.total_price - orderItem.vat_amount),
        quantity: orderItem.count,
        totalAmount: orderItem.total_price * 100,
        amount_incl_vat: true,
      }),
    )

    return exits.success(orderLines)

  },
}
