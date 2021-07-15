module.exports = {

  admin: async (req) => {

    const user = await User.findOne(req.body.user)
    if (parseInt(user.client) !== parseInt(req.client.id)) {
      return false
    }

    return parseInt(req.body.user) === parseInt(user.id)
  },

  customer: async (req) => {
    return parseInt(req.body.user) === parseInt(req.user.id)
  },

}
