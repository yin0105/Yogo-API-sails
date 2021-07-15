module.exports = {
  friendlyName: 'Create an order and a new charge session with Reepay',

  inputs: {

  },

  exits: {
    forbidden: {
      responseType: 'forbidden',
    },
  },

  fn: async function (inputs, exits) {

    if (!await sails.helpers.can2('controller.ReepayPayments.create-order-and-charge-session', this.req)) {
      return exits.forbidden()
    }

    const order = await sails.helpers.order.createFromCart.with({
      user: this.req.user.id,
    })
      .tolerate('paymentOptionGoneAway', () => {
        return 'VALIDATION_ERROR'
      })
      .tolerate('userIsNotEligibleForCampaign', () => {
        return 'VALIDATION_ERROR'
      })

    if (order === 'VALIDATION_ERROR') {
      exits.success('E_INVALID_CART_ITEM')
    }

    const chargeSession = await sails.helpers.paymentProvider.reepay.createChargeSession.with({
      order: order
    })

    return exits.success(chargeSession)

  },
}
