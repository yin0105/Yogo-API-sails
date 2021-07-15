module.exports = {
  async admin(req, inputs) {
    const classItem = await Class.findOne({
      id: inputs.id,
      client: req.client.id,
      archived: false,
    });
    return !!classItem;
  },
};
