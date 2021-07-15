module.exports = {
  friendlyName: 'Is discount code valid for cart item?',

  inputs: {
    discountCode: {
      type: 'json',
      required: true,
      custom: discountCode => _.isObject(discountCode)
    },
    itemType: {
      type: 'string',
      required: true,
      isIn:['membership_type', 'class_pass_type','event','product']
    },
    itemId: {
      type: 'number',
      required: true
    }
  },

  sync: true,

  fn: function(inputs, exits) {

    const itemType = inputs.itemType
    const itemId = inputs.itemId

    const discountCodeValidForItems = inputs.discountCode.valid_for_items

    let itemCodes
    switch (itemType) {
      case 'membership_type':
        itemCodes = ['membership_types', 'membership_type_' + itemId]
        break

      case 'class_pass_type':
        itemCodes = ['class_pass_types', 'class_pass_type_' + itemId]
        break

      case 'event':
        itemCodes = ['events','event_' + itemId]
        break

      case 'product':
        itemCodes = ['products', 'product_' + itemId]
        break
    }

    const isDiscountCodeValidForItem = !!(_.intersection(itemCodes, discountCodeValidForItems).length)

    return exits.success(isDiscountCodeValidForItem)

  }
}
