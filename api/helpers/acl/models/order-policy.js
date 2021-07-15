module.exports = {

  sync: true,

  fn: (inputs, exits) => {

    return exits.success({

      read: async (user, recordId) => {
        if (!user) return false
        if (recordId) {
          const order = await Order.findOne(recordId)
        }
        if (user.admin) {
          if (recordId) {
            return parseInt(order.client) === parseInt(user.client)
          } else {
            return true
          }
        }


        if (user.customer) {
          if (recordId) {
            return parseInt(order.client) === parseInt(user.client) &&
              parseInt(order.user) === parseInt(user.id)
          } else {
            return false
          }
        }

        return false

      },

    })

  },

}
