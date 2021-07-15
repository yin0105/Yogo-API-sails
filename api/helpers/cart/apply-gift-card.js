const moment = require('moment-timezone');

module.exports = {
  friendlyName: 'Apply discount code to cart',

  inputs: {
    code: {
      type: 'string',
      required: true,
    },
    user: {
      type: 'ref',
      required: true,
    },
  },

  exits: {
    codeNotFound: {},
    moreThanOnePossibleCode: {},
    giftCardAlreadyApplied: {},
    giftCardIsUsedUp: {},
    giftCardHasExpired: {},
  },

  fn: async (inputs, exits) => {

    const userId = sails.helpers.util.idOrObjectIdInteger(inputs.user);

    const user = await User.findOne(userId);

    const clientId = user.client;

    const giftCards = await GiftCard.find({
      code: inputs.code,
      client_id: clientId,
      archived: false,
      activated: true,
    });

    if (!giftCards.length) {
      return exits.codeNotFound();
    }

    if (giftCards.length > 1) {
      return exits.moreThanOnePossibleCode();
    }

    const [giftCard] = giftCards;

    if (giftCard.amount_left <= 0) {
      return exits.giftCardIsUsedUp();
    }

    if (moment.tz(giftCard.valid_until, 'Europe/Copenhagen').isBefore(moment.tz('Europe/Copenhagen'), 'day')) {
      return exits.giftCardHasExpired();
    }

    const giftCardAlreadyApplied = !!(await CartItem.find({
      user: userId,
      item_type: 'gift_card_spend',
      item_id: giftCard.id,
    })).length;

    if (giftCardAlreadyApplied) {
      return exits.giftCardAlreadyApplied();
    }

    await CartItem.create({
      client: clientId,
      user: userId,
      item_type: 'gift_card_spend',
      item_id: giftCard.id,
    }).fetch();

    return exits.success();

  },
};
