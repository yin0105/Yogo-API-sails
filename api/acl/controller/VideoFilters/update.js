module.exports = {
  async admin(req, inputs) {
    const filter = await VideoFilter.findOne({
      id: inputs.id,
      client_id: req.client.id,
      archived: 0,
    });
    return !!filter;
  },
};
