module.exports = {
  async admin(req, inputs) {
    const requestedUser = await User.findOne({id: inputs.id})
    return parseInt(requestedUser.client) === req.client.id
  },

  async customer(req, inputs) {
    const requestedUser = await User.findOne({id: inputs.id})
    return parseInt(requestedUser.id) === req.user.id
  }
}
