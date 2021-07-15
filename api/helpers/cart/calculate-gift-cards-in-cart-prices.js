module.exports = {
  friendlyName: 'Calculate gift cards in cart values',

  inputs: {
    cartItems: {
      type: 'ref',
      required: true,
    },
  },

  fn: async (inputs, exits) => {

    const giftCardCartItems = _.filter(inputs.cartItems, {item_type: 'gift_card_spend'});
    const nonGiftCardItems = _.differenceBy(
      inputs.cartItems,
      giftCardCartItems,
      'id',
    );

    let cartSum = _.reduce(
      nonGiftCardItems,
      (sum, cartItem) => {
        const itemPrice = cartItem.item_type === 'membership_type'
          ? (cartItem.membership_campaign ?
              cartItem.membership_campaign.reduced_price :
              cartItem.payment_option.payment_amount
          )
          : cartItem.product.price;
        return sum + itemPrice;
      },
      0,
    );

    // Use gift cards that expire first
    const sortedGiftCardCartItems = _.sortBy(
      giftCardCartItems,
      'product.valid_until',
    );

    _.each(
      sortedGiftCardCartItems,
      (giftCardItem) => {
        giftCardItem.product.price = Math.min(cartSum, giftCardItem.product.amount_left) * -1;
        cartSum += giftCardItem.product.price;

        if (cartSum === 0) {
          return false;
        }
      },
    );

    return exits.success();

  },
};
