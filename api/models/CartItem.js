/**
 * CartItem.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  tableName: 'cart_item',

  attributes: {

    client: {
      model: 'Client',
    },

    user: {
      model: 'User',
    },

    item_type: {
      type: 'string',
      isIn: ['class_pass_type', 'membership_type', 'event', 'product', 'discount_code', 'gift_card_spend'],
    },

    item_id: 'number',

    payment_option: {
      model: 'MembershipTypePaymentOption',
    },

    membership_campaign: {
      model: 'MembershipCampaign',
    },

    real_user_name: 'string',

  },

  async populateProduct(cartItems) {

    let populatedCartItems = _.clone(cartItems)

    let populateQueries = []
    _.each(populatedCartItems, function (cartItem) {
      switch (cartItem.item_type) {
        case 'class_pass_type':
          populateQueries.push(
            ClassPassType.findOne(cartItem.item_id).populate('image'),
          )
          break
        case 'membership_type':
          populateQueries.push(
            MembershipType.findOne(cartItem.item_id).populate('image').populate('payment_options'),
          )
          break
        case 'event':
          populateQueries.push(
            Event.findOne(cartItem.item_id).populate('image'),
          )
          break
        case 'product':
          populateQueries.push(
            Product.findOne(cartItem.item_id).populate('image'),
          )
          break
        case 'discount_code':
          populateQueries.push(
            DiscountCode.findOne(cartItem.item_id),
          )
          break
        case 'gift_card_spend':
          populateQueries.push(
            GiftCard.findOne(cartItem.item_id),
          )
          break
      }
    })
    let results = await Promise.all(populateQueries)


    // Set product details on the cart item
    _.each(populatedCartItems, function (cartItem, idx) {
      cartItem.product = results[idx]
    })

    // Destroy cart items where product has disappeared
    const cartItemIdsWithMissingProduct = _.map(populatedCartItems, cartItem => cartItem.product ? false : cartItem.id)
    await CartItem.destroy({id: cartItemIdsWithMissingProduct})

    populatedCartItems = _.filter(populatedCartItems, cartItem => !!cartItem.product)

    const discountCodeCartItem = _.find(populatedCartItems, ['item_type', 'discount_code'])
    if (discountCodeCartItem) {
      discountCodeCartItem.product.price = (await sails.helpers.cart.calculateDiscountCodeInCartPrice(populatedCartItems)).price
    }

    await sails.helpers.cart.calculateGiftCardsInCartPrices(populatedCartItems);

    return populatedCartItems

  },

  async populatePaymentOption(cartItems) {

    let populatedCartItems = _.clone(cartItems)

    let paymentOptionIds = _.map(populatedCartItems, 'payment_option')
    paymentOptionIds = _.uniq(_.compact(paymentOptionIds))

    let paymentOptions = await MembershipTypePaymentOption.find({id: paymentOptionIds})

    paymentOptions = _.keyBy(paymentOptions, 'id')


    _.each(
      populatedCartItems,
      cartItem => cartItem.payment_option = paymentOptions[cartItem.payment_option],
    )

    return populatedCartItems

  },

  async populateMembershipCampaign(cartItems) {

    let populatedCartItems = _.clone(cartItems)

    let membershipCampaignIds = _.map(populatedCartItems, 'membership_campaign')
    membershipCampaignIds = _.uniq(_.compact(membershipCampaignIds))

    let membershipCampaigns = await MembershipCampaign.find({id: membershipCampaignIds})

    membershipCampaigns = _.keyBy(membershipCampaigns, 'id')


    _.each(
      populatedCartItems,
      cartItem => cartItem.membership_campaign = membershipCampaigns[cartItem.membership_campaign],
    )

    return populatedCartItems

  },

  async validateCartItem(cartItem) {
    // TODO
  },

}

