module.exports = {
  friendlyName: 'Create gift card',

  inputs: {
    giver_name: {
      type: 'string',
      required: true,
    },
    giver_email: {
      type: 'string',
      required: true,
      isEmail: true,
    },
    recipient_name: {
      type: 'string',
      required: true,
    },
    recipient_email: {
      type: 'string',
      required: true,
      isEmail: true,
    },
    message: {
      type: 'string',
      required: true,
    },
    amount: {
      type: 'number',
      required: true,
    },
    amount_left: {
      type: 'number',
      required: true,
    },
    valid_until: {
      type: 'string',
      custom: d => d.match(/^\d\d\d\d-\d\d-\d\d$/),
      required: true,
    },
    sendToRecipientNow: {
      type: 'boolean',
      defaultsTo: false,
    },
  },

  exits: {
    forbidden: {
      responseType: 'forbidden',
    },
  },

  fn: async function (inputs, exits) {

    if (!await sails.helpers.can2('controller.GiftCards.create', this.req)) {
      return exits.forbidden();
    }

    let code,
      existingGiftCard,
      existingDiscountCode;

    do {
      code = sails.helpers.string.randomCode(6);
      existingGiftCard = await GiftCard.findOne({
        client_id: this.req.client.id,
        code,
      });
      existingDiscountCode = await DiscountCode.findOne({
        client: this.req.client.id,
        name: code,
      });
    } while (existingGiftCard || existingDiscountCode);

    let giftCard = await GiftCard.create({
      client_id: this.req.client.id,
      code,
      giver_name: inputs.giver_name,
      giver_email: inputs.giver_email,
      recipient_name: inputs.recipient_name,
      recipient_email: inputs.recipient_email,
      message: inputs.message,
      activated: true,
      valid_until: inputs.valid_until,
      amount: inputs.amount,
      amount_left: inputs.amount_left,
    }).fetch();

    const giftCardDeliveryMode = await sails.helpers.clientSettings.find(this.req.client, 'gift_card_delivery_mode');

    if (giftCardDeliveryMode === 'auto' && inputs.sendToRecipientNow) {
      await sails.helpers.email.customer.giftCard(giftCard);
      giftCard = await GiftCard.update({id: giftCard.id}, {
        sent_at: Date.now(),
        sent_by: 'system',
      }).fetch();
    }

    const locale = await sails.helpers.clientSettings.find(giftCard.client_id, 'locale');
    await sails.helpers.giftCardLog.log(
      giftCard,
      sails.helpers.t(
        'giftCardLog.GiftCardCreatedByAdminWithAmountAndAmountLeftAndUser',
        [
          (giftCard.amount) + ' DKK',
          (giftCard.amount_left) + ' DKK',
          sails.helpers.util.formatDate(giftCard.valid_until, locale),
          `${this.req.user.first_name} ${this.req.user.last_name} (ID ${this.req.user.id})`
        ],
      ),
    );

    return exits.success(giftCard);

  },
};
