module.exports = {
  friendlyName: 'Remove order items from cart (probably because they were bought)',

  inputs: {
    order: {
      type: 'ref',
      required: true,
    },
  },

  fn: async (inputs, exits) => {

    const orderId = sails.helpers.util.idOrObjectIdInteger(inputs.order)
    const order = await Order.findOne(orderId).populate('order_items')


    await Promise.all(order.order_items.map(async (orderItem) => {
      await CartItem.destroy({
        user: order.user,
        item_type: orderItem.item_type,
        item_id: orderItem.item_id,
      })
    }))

    return exits.success()

  },
}
