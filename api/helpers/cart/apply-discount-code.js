module.exports = {
  friendlyName: 'Apply discount code to cart',

  inputs: {
    code: {
      type: 'string',
      required: true,
    },
    user: {
      type: 'ref',
      required: true,
    },
  },

  exits: {
    codeNotFound: {},
    moreThanOnePossibleCode: {},
    codeCustomerLimitReached: {},
    codeUsePerCustomerLimitReached: {},
  },

  fn: async (inputs, exits) => {

    const userId = sails.helpers.util.idOrObjectIdInteger(inputs.user)

    const user = await User.findOne(userId)

    const clientId = user.client

    await CartItem.destroy({
      user: userId,
      item_type: 'discount_code',
    })

    const discountCodes = await DiscountCode.find({
      name: inputs.code,
      client: clientId,
      active: true,
      archived: false,
    })

    if (!discountCodes.length) {
      throw 'codeNotFound'
    }

    if (discountCodes.length > 1) {
      throw 'moreThanOnePossibleCode'
    }

    const discountCode = discountCodes[0]


    if (discountCode.has_customer_limit) {

      const previousCustomerCountResult = await knex({o: 'order'})
        .innerJoin({oi: 'order_item'}, 'o.id', 'oi.order')
        .countDistinct('o.user as userCount')
        .where({
          'oi.item_type': 'discount_code',
          'oi.item_id': discountCode.id,
          'oi.archived': 0,
          'o.client': clientId,
          'o.archived': 0,
        })
        .andWhere('o.invoice_id', '>', 0)
        .first()

      const previousCustomerCount = previousCustomerCountResult ?
        previousCustomerCountResult.userCount :
        0

      if (previousCustomerCount >= discountCode.customer_limit) {
        throw 'codeCustomerLimitReached'
      }
    }

    if (discountCode.has_use_per_customer_limit) {

      const previousUseCountForThisCustomerResult = await knex({oi: 'order_item'})
        .innerJoin({o: 'order'}, 'o.id', 'oi.order')
        .count('o.id AS orderCount')
        .where({
          'oi.item_type': 'discount_code',
          'oi.item_id': discountCode.id,
          'oi.archived': 0,
          'o.user': userId,
          'o.archived': 0,
        })
        .andWhere('o.invoice_id', '>', 0)
        .groupBy('o.user')
        .first()

      const previousUseCountForThisCustomer = previousUseCountForThisCustomerResult ?
        previousUseCountForThisCustomerResult.orderCount :
        0

      if (previousUseCountForThisCustomer >= discountCode.use_per_customer_limit) {
        throw 'codeUsePerCustomerLimitReached'
      }
    }

    await CartItem.create({
      client: clientId,
      user: userId,
      item_type: 'discount_code',
      item_id: discountCode.id,
    })

    return exits.success()

  },
}
