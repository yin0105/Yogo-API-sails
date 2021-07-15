module.exports = {

  admin: async (req) => {

    const user = await User.findOne(req.query.user)

    return parseInt(user.client) === parseInt(req.client.id)

  },

  customer: async (req) => {
    return parseInt(req.query.user) === parseInt(req.user.id)
  },

}
