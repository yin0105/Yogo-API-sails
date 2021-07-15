module.exports = {
  async admin(req, inputs) {
    const giftCard = await GiftCard.findOne(inputs.id);
    return parseInt(giftCard.client_id) === parseInt(req.client.id);
  },
};
