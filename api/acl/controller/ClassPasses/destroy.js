module.exports = {

  async admin(req, inputs) {
    const classPass = await ClassPass.findOne(inputs.id);
    return parseInt(classPass.client) === parseInt(req.client.id);
  }

};
