module.exports = {
  async admin(req, inputs) {
    const giftCard = await GiftCard.findOne({
      id: inputs.id,
      archived: false,
      activated: true
    });
    return parseInt(giftCard.client_id) === parseInt(req.client.id);
  },
};
