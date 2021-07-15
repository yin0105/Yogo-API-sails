module.exports = {
  friendlyName: 'Update gift card',

  inputs: {
    id: {
      type: 'number',
      required: true,
    },
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
  },

  exits: {
    forbidden: {
      responseType: 'forbidden',
    },
    notFound: {
      responseType: 'notFound',
    },
  },

  fn: async function (inputs, exits) {

    if (!await sails.helpers.can2('controller.GiftCards.update', this.req, inputs)) {
      return exits.forbidden();
    }

    const [updatedGiftCard] = await GiftCard.update({id: inputs.id}, {
      giver_name: inputs.giver_name,
      giver_email: inputs.giver_email,
      recipient_name: inputs.recipient_name,
      recipient_email: inputs.recipient_email,
      message: inputs.message,
      valid_until: inputs.valid_until,
      amount: inputs.amount,
      amount_left: inputs.amount_left,
    }).fetch();

    const locale = await sails.helpers.clientSettings.find(updatedGiftCard.client_id, 'locale');
    await sails.helpers.giftCardLog.log(
      updatedGiftCard,
      sails.helpers.t(
        'giftCardLog.GiftCardUpdatedByAminWithAmountLeftAndUser',
        [
          (updatedGiftCard.amount_left) + ' DKK',
          sails.helpers.util.formatDate(updatedGiftCard.valid_until, locale),
          `${this.req.user.first_name} ${this.req.user.last_name} (ID ${this.req.user.id})`,
        ],
      ),
    );

    return exits.success(updatedGiftCard);

  },
};
