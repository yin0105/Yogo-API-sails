module.exports = {
  friendlyName: 'Update gift card after applying it to an order',

  inputs: {
    giftCard: {
      type: 'ref',
      required: true,
    },
    order: {
      type: 'ref',
      required: true,
    },
  },

  fn: async (inputs, exits) => {

    const giftCardId = sails.helpers.util.idOrObjectIdInteger(inputs.giftCard);
    const giftCard = await GiftCard.findOne(giftCardId);

    const orderId = sails.helpers.util.idOrObjectIdInteger(inputs.order);
    const order = await Order.findOne(orderId).populate('order_items');

    const orderItem = _.find(order.order_items, {item_type: 'gift_card_spend', item_id: giftCardId});

    // Amount is always negative on gift_card_spend
    const usedAmount = orderItem.total_price;

    if (giftCard.amount_left + usedAmount < 0) {
      await sails.helpers.email.send.with({
        non_user_email: 'kontakt@yogo.dk',
        client: giftCard.client_id,
        subject: 'Possible fraud attempted with gift card ID ' + giftCardId,
        text: 'The amount left on the gift card is less than what is required for the order, ID ' + orderId,
        emailType: 'yogo_admin_warning',
      });
      throw new Error('Gift card amount less than required.');
    }

    await GiftCard.update({id: giftCardId}, {
      amount_left: giftCard.amount_left + usedAmount,
    });

    await sails.helpers.giftCardLog.log(
      giftCard,
      sails.helpers.t(
        'giftCardLog.GiftCardSpentOnInvoiceIdWithAmountAndAmountLeft',
        [
          order.id,
          (-usedAmount) + ' DKK',
          (giftCard.amount_left + usedAmount) + ' DKK',
        ],
      ),
    );

    return exits.success();

  },
};
