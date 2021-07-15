module.exports = {
  friendlyName: 'Create an order and a new charge session with Reepay for buying a gift card without creating a user',

  inputs: {
    amount: {
      type: 'number',
      required: true,
    },
    recipient_name: {
      type: 'string',
      required: true,
    },
    recipient_email: {
      type: 'string',
      isEmail: true,
    },
    giver_name: {
      type: 'string',
      required: true,
    },
    giver_email: {
      type: 'string',
      isEmail: true,
      required: true,
    },
    message: {
      type: 'string',
    },
  },

  exits: {
    forbidden: {
      responseType: 'forbidden',
    },
  },

  fn: async function (inputs, exits) {

    // This endpoint is open to anonymous users.

    const minimumAmount = await sails.helpers.clientSettings.find(this.req.client.id, 'gift_card_minimum_amount');

    if (inputs.amount < minimumAmount) {
      const errorResponse = await sails.helpers.applicationError.buildResponse('giftCardAmountTooSmall', this.req, {minimumAmount})
      return exits.success(errorResponse);
    }

    const giftCardData = _.cloneDeep(inputs);
    giftCardData.client_id = this.req.client.id;
    const giftCard = await GiftCard.create(giftCardData).fetch();

    const order = await Order.create({
      client: this.req.client.id,
      non_user_email: inputs.giver_email,
      non_user_name: inputs.giver_name,
      total: inputs.amount,
    }).fetch();

    await OrderItem.create({
      client: this.req.client.id,
      order: order.id,
      item_type: 'gift_card_purchase',
      item_id: giftCard.id,
      name: sails.helpers.t('global.GiftCard'),
      count: 1,
      item_price: inputs.amount,
      total_price: inputs.amount,
    }).fetch();

    const chargeSession = await sails.helpers.paymentProvider.reepay.createChargeSession.with({
      order: order,
    });

    return exits.success({chargeSession});

  },
};
