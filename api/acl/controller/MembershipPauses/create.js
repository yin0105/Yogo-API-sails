module.exports = {
  /*async customer(req, inputs) {
    const membership = await Membership.findOne(inputs.membership);
    return parseInt(membership.user) === parseInt(req.user.id);
  },*/

  async admin(req, inputs) {
    const membership = await Membership.findOne(inputs.membership);
    return parseInt(membership.client) === parseInt(req.client.id);
  },
};
