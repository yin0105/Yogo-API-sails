module.exports = {
  friendlyName: 'Create cart item',

  inputs: {
    item_type: {
      type: 'string',
      isIn: ['membership_type', 'class_pass_type', 'event', 'product', 'discount_code'],
      required: true,
    },
    item_id: {
      type: 'number',
      required: false,
    },
    item_count: {
      type: 'number',
      defaultsTo: 1,
    },
    payment_option: {
      type: 'number',
      description: 'ID of the selected payment option for memberships',
      required: false,
    },
    user: {
      type: 'number',
      required: true,
    },
    membership_campaign: {
      type: 'number',
      description: 'ID of the currently active membership campaign',
      required: false,
    },
    destroyOthers: {
      type: 'boolean',
      description: 'Removes existing cart items',
      defaultsTo: false,
    },
    discount_code: {
      type: 'string',
      description: 'The discount code to apply',
      required: false,
    },
  },

  exits: {
    badRequest: {
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {

    if (!await sails.helpers.can2('controller.CartItems.create', this.req)) {
      return this.res.forbidden();
    }

    if (_.includes(['membership_type', 'class_pass_type', 'event', 'product'], inputs.item_type) && !inputs.item_id) {
      return exits.badRequest('Missing item_id');
    }

    if (inputs.item_type === 'discount_code' && !inputs.discount_code) {
      return exits.badRequest('Missing discount_code');
    }

    if (inputs.item_type === 'discount_code') {
      const discountCodeResult = await sails.helpers.cart.applyDiscountCode(inputs.discount_code, inputs.user)
        .tolerate('codeNotFound', async () => {
          return 'NOT_FOUND';
        })
        .tolerate('codeCustomerLimitReached', async () => {
          exits.success('E_DISCOUNT_CODE_CUSTOMER_LIMIT_REACHED');
          return 'E';
        })
        .tolerate('codeUsePerCustomerLimitReached', async () => {
          exits.success('E_DISCOUNT_CODE_USE_PER_CUSTOMER_LIMIT_REACHED');
          return 'E';
        });

      let giftCardResult;
      if (discountCodeResult === 'NOT_FOUND') {
        giftCardResult = await sails.helpers.cart.applyGiftCard(inputs.discount_code, inputs.user)
          .tolerate('codeNotFound', async () => {
            exits.success('E_DISCOUNT_CODE_NOT_FOUND');
            return 'E';
          })
          .tolerate('giftCardAlreadyApplied')
          .tolerate('giftCardIsUsedUp', async () => {
            exits.success('E_GIFT_CARD_IS_USED_UP');
            return 'E';
          })
          .tolerate('giftCardHasExpired', async () => {
            exits.success('E_GIFT_CARD_HAS_EXPIRED');
            return 'E';
          });
      }

      if (discountCodeResult === 'E' || giftCardResult === 'E') {
        return;
      } else {
        return exits.success();
      }

    }

    const cartItem = _.pick(inputs, [
      'item_type',
      'item_id',
      'item_count',
      'payment_option',
      'user',
      'membership_campaign',
    ]);

    cartItem.client = this.req.client.id;

    const cartItemsToCreate = [];
    // Temporary solution for multiple products of the same kind
    for (let j = 0; j < cartItem.item_count; j++) {
      cartItemsToCreate.push(_.cloneDeep(cartItem));
    }


    let destroyQueries = [];

    if (inputs.destroyOthers) {

      destroyQueries.push(CartItem.destroy({
        user: cartItemsToCreate[0].user,
      }));

    } else {

      if (cartItemsToCreate[0].item_type !== 'product') {
        destroyQueries.push(CartItem.destroy({
          user: cartItemsToCreate[0].user,
          item_type: cartItemsToCreate[0].item_type,
          item_id: cartItemsToCreate[0].item_id,
        }));
      }

      if (cartItemsToCreate[0].item_type === 'membership_type') {
        // Only pay for one membership at a time. We need separate subscriptions (probably?)
        destroyQueries.push(CartItem.destroy({
          user: cartItemsToCreate[0].user,
          item_type: 'membership_type',
        }));
      }
    }

    await Promise.all(destroyQueries);

    const createdCartItems = await CartItem.createEach(cartItemsToCreate).fetch();

    return exits.success(createdCartItems[0]);

  },

};
