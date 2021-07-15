module.exports = {
  friendlyName: 'Find discount codes',

  inputs: {
    id: {
      type: 'number',
      required: false
    },
    validFor: {
      type: 'string',
      required: false,
      description: 'Only return discount codes that are valid for this item'
    }
  },

  exits: {
    forbidden: {
      responseType: 'forbidden'
    }
  },

  fn: async function(inputs, exits) {

    if (!(await sails.helpers.can2('controller.DiscountCodes.find', this.req))) {
      return exits.forbidden()
    }

    const queryParams = {
      client: this.req.client.id,
      archived: false
    }

    if (inputs.id) {
     queryParams.id = inputs.id
    }

    const discountCodes = await DiscountCode.find(queryParams)
      .sort('createdAt')
      .populate('membership_campaign')

    if (inputs.validFor) {
      const itemParts = /^(membership_type|class_pass_type|event|product)_(\d+)$/g.exec(inputs.validFor)
      const itemType = itemParts[1]
      const itemId = itemParts[2]
      _.remove(discountCodes, (discountCode => {
        return !sails.helpers.cart.isDiscountCodeValidForItem(discountCode, itemType, itemId)
      }))
    }

    if (this.req.query.populate && _.includes(this.req.query.populate, 'valid_for_items_text')) {
      await sails.helpers.populate.discountCodes.validForItemsText(discountCodes)
    }

    if (this.req.query.populate && _.includes(this.req.query.populate, 'discount_type_text')) {
      await sails.helpers.populate.discountCodes.discountTypeText(discountCodes)
    }

    return exits.success(discountCodes)
  }
}
