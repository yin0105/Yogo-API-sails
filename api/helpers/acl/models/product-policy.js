module.exports = {

  sync: true,

  fn: (inputs, exits) => {

    return exits.success({

      read: async (user, recordId) => {
        return true
      },

      update: async (user, recordId) => {
        if (!recordId) return false
        const product = await Product.findOne(recordId)
        return (
          user &&
          user.admin &&
          sails.helpers.util.idOrObjectIdInteger(user.client) === parseInt(product.client)
        )
      },

      create: async (user) => {
        return !!user.admin
      },

      destroy: async (user, recordId) => {
        if (!recordId) return false
        const product = await Product.findOne(recordId)
        return (
          user &&
          user.admin &&
          sails.helpers.util.idOrObjectIdInteger(user.client) === parseInt(product.client)
        )
      },

    })

  },

}
