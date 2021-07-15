module.exports = {
  friendlyName: 'Log to gift card log',

  inputs: {
    giftCard: {
      type: 'ref',
      required: true,
    },
    entry: {
      type: 'string',
      required: true
    },
  },

  fn: async (inputs, exits) => {

    const giftCard = await sails.helpers.util.objectFromObjectOrObjectId(inputs.giftCard, GiftCard);

    await GiftCardLog.create({
      client_id: giftCard.client_id,
      gift_card_id: giftCard.id,
      entry: inputs.entry,
    });

    return exits.success();

  }
}
