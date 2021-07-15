const knex = require('../../services/knex')

module.exports = {
  friendlyName: 'Create discount code',

  inputs: {
    name: {
      type: 'string',
      required: true,
    },

    type: {
      type: 'string',
      isIn: ['discount_percent', 'discount_amount', 'membership_campaign'],
      required: true,
    },

    discount_percent: {
      type: 'number',
      required: false,
    },

    discount_amount: {
      type: 'number',
      required: false,
    },

    membership_campaign: {
      type: 'number',
      required: false,
    },

    valid_for_items: {
      type: 'json',
      required: true,
    },

    has_customer_limit: {
      type: 'boolean',
      required: true,
    },

    customer_limit: {
      type: 'number',
      required: false,
    },

    has_use_per_customer_limit: {
      type: 'boolean',
      required: true,
    },

    use_per_customer_limit: {
      type: 'number',
      required: false,
    },

    active: {
      type: 'boolean',
      required: true,
    },
  },

  exits: {
    forbidden: {
      responseType: 'forbidden',
    },
  },

  fn: async function (inputs, exits) {

    if (!(await sails.helpers.can2('controller.DiscountCodes.create', this.req))) {
      return exits.forbidden()
    }

    // TODO Validate inputs

    const existingDiscountCodeWithSameCode = await knex('discount_code')
      .where({
        name: inputs.name,
        archived: 0,
        client: this.req.client.id,
      })

    const existingGiftCardWithSameCode = await knex('gift_card')
      .where({
        code: inputs.name,
        archived: 0,
        client_id: this.req.client.id,
      })

    if (existingDiscountCodeWithSameCode.length || existingGiftCardWithSameCode.length) {
      return exits.success('E_CODE_EXISTS')
    }

    const discountCodeData = _.clone(inputs)
    discountCodeData.client = this.req.client.id

    const createdDiscountCode = await DiscountCode.create(discountCodeData).fetch()

    return exits.success(createdDiscountCode)
  },
}
