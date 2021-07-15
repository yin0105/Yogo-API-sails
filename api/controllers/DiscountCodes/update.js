module.exports = {
  friendlyName: 'Update discount code',

  inputs: {
    name: {
      type: 'string',
      required: false,
    },

    type: {
      type: 'string',
      isIn: ['discount_percent', 'discount_amount', 'membership_campaign'],
      required: false,
    },

    discount_percent: {
      type: 'number',
      required: false,
    },

    discount_amount: {
      type: 'number',
      required: false,
    },

    valid_for_items: {
      type: 'json',
      required: false,
    },

    has_customer_limit: {
      type: 'boolean',
      required: false,
    },

    customer_limit: {
      type: 'number',
      required: false,
    },

    has_use_per_customer_limit: {
      type: 'boolean',
      required: false,
    },

    use_per_customer_limit: {
      type: 'number',
      required: false,
    },

    active: {
      type: 'boolean',
      required: false,
    },
  },

  exits: {
    forbidden: {
      responseType: 'forbidden',
    },
  },

  fn: async function (inputs, exits) {

    if (!(await sails.helpers.can2('controller.DiscountCodes.update', this.req))) {
      return exits.forbidden()
    }

    const existingDiscountCodesWithSameCode = await knex('discount_code')
      .where({
        client: this.req.client.id,
        name: inputs.name,
        archived: false,
      })
      .andWhere('id', '!=', this.req.param('id'))

    if (existingDiscountCodesWithSameCode.length) {
      return exits.success('E_CODE_EXISTS')
    }

    const updatedDiscountCode = await DiscountCode.update({id: this.req.param('id')}, inputs).fetch()

    return exits.success(updatedDiscountCode)
  },
}
