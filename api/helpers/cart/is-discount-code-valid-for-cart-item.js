module.exports = {
  friendlyName: 'Is discount code valid for cart item?',

  inputs: {
    discountCode: {
      type: 'json',
      required: true,
      custom: discountCode => _.isObject(discountCode)
    },
    cartItem: {
      type: 'json',
      required: true,
      custom: cartItem => _.isObject(cartItem)
    }
  },

  sync: true,

  fn: function(inputs, exits) {

    const cartItemType = inputs.cartItem.item_type
    const cartItemId = inputs.cartItem.item_id

    const isDiscountCodeValidForCartItem = sails.helpers.cart.isDiscountCodeValidForItem(inputs.discountCode, cartItemType, cartItemId)

    return exits.success(isDiscountCodeValidForCartItem)

  }
}
