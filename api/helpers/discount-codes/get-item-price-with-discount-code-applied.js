module.exports = {
  friendlyName: 'Get item price with discount code applied',

  inputs: {
    itemPrice: {
      type: 'number',
      required: true
    },
    discountCode: {
      type: 'ref',
      required: true,
      description: 'The discount code to apply'
    },
  },

  fn: async (inputs, exits) => {

    let discountCode
    if (_.isObject(inputs.discountCode)) {
      discountCode = inputs.discountCode
    } else {
      discountCode = await DiscountCode.findOne(inputs.discountCode)
    }


    if (discountCode.type === 'discount_percent') {
      const newItemPrice = inputs.itemPrice * (100 - discountCode.discount_percent) / 100
      return exits.success(newItemPrice)
    }

    if (discountCode.type === 'discount_amount') {
      const newItemPrice = Math.max(inputs.itemPrice - discountCode.discount_amount, 0)
      return exits.success(newItemPrice)
    }

    return exits.error(new Error('Discount type ' + discountCode.type + ' not implemented yet'))

  }


}
