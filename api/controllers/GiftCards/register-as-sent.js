module.exports = {
  friendlyName: 'Register gift card as sent.',

  description: 'Registers the gift card as sent by the current user.',

  inputs: {
    id: {
      type: 'number',
      required: true,
    },
  },

  exits: {
    forbidden: {
      responseType: 'forbidden',
    },
  },

  fn: async function (inputs, exits) {

    if (!await sails.helpers.can2('controller.GiftCards.register-as-sent', this.req)) {
      return this.exits.forbidden();
    }

    const giftCard = await GiftCard.findOne({id: inputs.id});
    if (!giftCard) {
      return exits.success(
        await sails.helpers.applicationError.buildResponse('giftCardDoesNotExist', this.req),
      );
    }

    if (giftCard.sent_at) {
      return exits.success(
        await sails.helpers.applicationError.buildResponse('giftCardAlreadySent', this.req),
      );
    }

    const [updatedGiftCard] = await GiftCard.update({id: inputs.id}, {
      sent_at: Date.now(),
      sent_by: 'user',
      sent_by_user_id: this.req.user.id,
    }).fetch();

    await sails.helpers.giftCardLog.log(
      updatedGiftCard.id,
      sails.helpers.t(
        'giftCardLog.GiftCardRegisteredAsSentWithUser',
        [`${this.req.user.first_name} ${this.req.user.last_name} (ID ${this.req.user.id})`]
      ),
    );

    return exits.success(updatedGiftCard);

  },
};
