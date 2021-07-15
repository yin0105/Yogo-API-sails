module.exports = {
  friendlyName: 'Calculate discount value',

  inputs: {
    cartItems: {
      type: 'ref',
      required: true,
    },
  },

  fn: async (inputs, exits) => {

    const discountCodeCartItem = _.find(inputs.cartItems, ['item_type', 'discount_code'])

    if (!discountCodeCartItem) throw new Error('No discount code in cartItems')

    const discountCode = await DiscountCode.findOne(discountCodeCartItem.item_id)

    let discountCodeCartItemValue = 0
    let discountCodeRemaingValue = discountCode.type === 'discount_amount' ? discountCode.discount_amount : 0
    let discountCodeCartItemVat = 0

    const isDiscountCodeValidForCartItem = sails.helpers.cart.isDiscountCodeValidForCartItem

    const cartItemAppliedDiscountAmounts = []

    await Promise.all(_.map(inputs.cartItems, async (cartItem, cartItemIdx) => {
      switch (cartItem.item_type) {

        case 'membership_type':
          if (cartItem.membership_campaign) {
            // Can not use discount code in addition to a campaign
            return
          }
          if (isDiscountCodeValidForCartItem(discountCode, cartItem)) {

            const paymentOption = await MembershipTypePaymentOption.findOne(cartItem.payment_option)

            let discountForCartItemMembershipType
            switch (discountCode.type) {
              case  'discount_percent':
                discountForCartItemMembershipType = paymentOption.payment_amount * discountCode.discount_percent / 100
                break
              case 'discount_amount':
                discountForCartItemMembershipType = Math.min(discountCodeRemaingValue, paymentOption.payment_amount)
                discountCodeRemaingValue -= discountForCartItemMembershipType
                break
            }
            discountCodeCartItemValue += discountForCartItemMembershipType
            cartItemAppliedDiscountAmounts[cartItemIdx] = discountForCartItemMembershipType
          }
          break

        case 'class_pass_type':
        case 'event':
        case 'product':
          if (isDiscountCodeValidForCartItem(discountCode, cartItem)) {
            let cartItemProduct
            if (cartItem.item_type === 'class_pass_type') {
              cartItemProduct = await ClassPassType.findOne(cartItem.item_id)
            }
            if (cartItem.item_type === 'event') {
              cartItemProduct = await Event.findOne(cartItem.item_id)
            }
            if (cartItem.item_type === 'product') {
              cartItemProduct = await Product.findOne(cartItem.item_id)
            }
            let discountForCartItem
            switch (discountCode.type) {
              case 'discount_percent':
                discountForCartItem = cartItemProduct.price * discountCode.discount_percent / 100
                break
              case 'discount_amount':
                discountForCartItem = Math.min(discountCodeRemaingValue, cartItemProduct.price)
                discountCodeRemaingValue -= discountForCartItem
                break
            }

            discountCodeCartItemValue += discountForCartItem
            if (cartItem.item_type === 'product') {
              discountCodeCartItemVat += discountForCartItem * 0.2
            }
            cartItemAppliedDiscountAmounts[cartItemIdx] = discountForCartItem

          }
          break
      }
    }))

    discountCodeCartItemValue = discountCodeCartItemValue * -1
    discountCodeCartItemVat = discountCodeCartItemVat * -1

    return exits.success({
      price: discountCodeCartItemValue,
      vat: discountCodeCartItemVat,
      discountCodeAmounts: cartItemAppliedDiscountAmounts
    })

  },
}
