module.exports = {

  sync: true,

  fn: (inputs, exits) => {

    return exits.success({

      read: async (user, recordId) => {
        if (!user) return false

        if (user && !recordId) return true

        // user && recordId are set

        const cartItem = await CartItem.findOne(recordId)
        if (user.admin) {
          return parseInt(cartItem.client) === parseInt(user.client)
        }
        if (user.customer) {
          return parseInt(cartItem.client) === parseInt(user.client) &&
            parseInt(cartItem.user) === parseInt(user.id)
        }

        return false

      },

      create: async (user, cartItem) => {
        if (!user) return false
        if (user.customer) {
          return parseInt(cartItem.user) === parseInt(user.id)
        }
        if (user.admin) {
          const cartItemUser = await User.findOne(cartItem.user)
          return parseInt(cartItemUser.client) === parseInt(user.client)
        }
        return false
      },

      destroy: async (user, recordId) => {
        if (!recordId) return false
        const cartItem = await CartItem.findOne(recordId)
        return (
          user &&
          user.admin &&
          sails.helpers.util.idOrObjectIdInteger(user.client) === parseInt(cartItem.client)
        )
      },

    })

  },

}
