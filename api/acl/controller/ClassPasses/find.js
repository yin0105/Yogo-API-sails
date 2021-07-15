module.exports = {

  async admin(req, inputs) {
    if (inputs.id) {
      const classPass = await ClassPass.findOne(inputs.id);
      return parseInt(classPass.client) === parseInt(req.client.id);
    } else {
      const user = await User.findOne(inputs.user);
      return parseInt(user.client) === parseInt(req.client.id);
    }
  },

  async customer(req, inputs) {
    if (inputs.id) {
      const classPass = await ClassPass.findOne(inputs.id);
      return parseInt(classPass.user) === parseInt(req.user.id);
    } else  {
      return parseInt(inputs.user) === parseInt(req.user.id);
    }
  },

};
