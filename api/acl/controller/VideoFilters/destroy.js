module.exports = {
  async admin(req, inputs) {
    console.log('req.client.id, inputs.id:', req.client.id, inputs.id );
    const videoFilter = await VideoFilter.findOne({
      id: inputs.id,
      client_id: req.client.id,
      archived: 0,
    });
    console.log('ACL videoFilter:', videoFilter);
    return !!videoFilter;
  },
};
