module.exports = {

  async admin(req) {
    const user = await User.findOne(req.param('id'));
    return parseInt(user.client) === parseInt(req.client.id);
  },

};
