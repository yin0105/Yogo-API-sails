module.exports = {
  friendlyName: 'Populate discount_type_text',

  inputs: {
    discountCodes: {
      type: 'ref',
      required: true,
    },
  },

  fn: async function (inputs, exits) {

    if (!inputs.discountCodes.length) {
      return exits.success([])
    }

    if (typeof inputs.discountCodes[0].discount_type_text !== 'undefined') {
      return exits.success(inputs.discountCodes)
    }

    _.each(inputs.discountCodes, discountCode => {
      switch (discountCode.type) {
        case 'discount_percent':
          discountCode.discount_type_text = discountCode.discount_percent + '%'
          break;
        case 'discount_amount':
          discountCode.discount_type_text = discountCode.discount_amount + ' kr'
          break;
      }
    })

    return exits.success(inputs.discountCodes)
  },
}
