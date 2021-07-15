module.exports = {
  async admin(req, inputs) {
    if (inputs.id) {
      const giftCard = await GiftCard.findOne(inputs.id);
      return parseInt(giftCard.client_id) === parseInt(req.client.id);
    }
    return true;
  },
};
