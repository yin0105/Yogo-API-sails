module.exports = {
  async admin(req) {

    const noShowFee = await NoShowFee.findOne({
      client_id: req.client.id,
      id: req.param('id'),
      archived: false,
    });

    return !!noShowFee;

  },
};
