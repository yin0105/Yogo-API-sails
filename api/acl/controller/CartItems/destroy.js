module.exports = {

  admin: async (req) => {
    const cartItem = await CartItem.findOne(req.param('id'))

    if (!cartitem) {
      const e = new Error()
      e.code = 'cartItemDoesNotExist'
      throw e
    }

    return parseInt(cartItem.client) === req.client.id
  },

  customer: async (req) => {
    const cartItem = await CartItem.findOne(req.param('id'))

    if (!cartItem) {
      const e = new Error()
      e.code = 'cartItemDoesNotExist'
      throw e
    }

    return parseInt(cartItem.user) === req.user.id
  },

}
