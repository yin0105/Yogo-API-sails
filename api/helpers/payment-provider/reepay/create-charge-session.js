module.exports = {
  friendlyName: 'Create Reepay charge session',

  inputs: {
    order: {
      type: 'ref',
      required: true,
    },
  },

  fn: async (inputs, exits) => {

    const orderId = sails.helpers.util.idOrObjectIdInteger(inputs.order);

    const order = await Order.findOne(orderId).populate('order_items').populate('user');

    let reepayCustomerData;

    const isGiftCardPurchase = order.order_items[0] && order.order_items[0].item_type === 'gift_card_purchase';

    if (isGiftCardPurchase) {
      const giftCard = await GiftCard.findOne(order.order_items[0].item_id);
      reepayCustomerData = {
        email: giftCard.giver_email,
        handle: giftCard.giver_email,
        first_name: giftCard.giver_name,
        last_name: '',
      };
    } else {
      reepayCustomerData = {
        email: order.user.email,
        handle: order.user.id,
        first_name: order.user.first_name,
        last_name: order.user.last_name,
      };
    }

    await sails.helpers.populate.orders.orderText([order]);

    const startRecurring = !!_.find(order.order_items, {item_type: 'membership_type'});

    const apiCallBody = {
      order: {
        handle: order.test ? order.payment_provider_order_id : order.id,
        order_lines: await sails.helpers.paymentProvider.reepay.orderLines.with({orderItems: order.order_items}),
        currency: "DKK",
        customer: reepayCustomerData,
      },
      settle: true,
      recurring: startRecurring,
    };

    const chargeSession = await sails.helpers.paymentProvider.reepay.api.checkout.with({
        client: order.client,
        method: 'POST',
        endpoint: '/session/charge',
        body: apiCallBody,
      },
    );

    return exits.success(chargeSession);

  },
};
