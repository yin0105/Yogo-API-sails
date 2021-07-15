module.exports = {
  friendlyName: 'Create an order and a new session with Reepay',

  description: 'Creates an order and either a charge session or a recurring session with Reepay. If the total is zero and there are no recurring items, the order is settled and no session created.',

  inputs: {

  },

  exits: {
    forbidden: {
      responseType: 'forbidden',
    },
  },

  fn: async function (inputs, exits) {

    if (!await sails.helpers.can2('controller.ReepayPayments.create-order-and-matching-session-type', this.req)) {
      return exits.forbidden()
    }

    const order = await sails.helpers.order.createFromCart.with({
      user: this.req.user.id,
    })
      .tolerate('membershipTypeArchived', () => {
        return 'VALIDATION_ERROR'
      })
      .tolerate('paymentOptionGoneAway', () => {
        return 'VALIDATION_ERROR'
      })
      .tolerate('classPassTypeArchived', () => {
        return 'VALIDATION_ERROR'
      })
      .tolerate('userIsNotEligibleForCampaign', () => {
        return 'VALIDATION_ERROR'
      })
      .tolerate('eventIsFullyBooked', () => {
        return 'VALIDATION_ERROR'
      })

    if (order === 'VALIDATION_ERROR') {
      exits.success('E_INVALID_CART_ITEM')
    }

    if (parseFloat(order.total) === 0) {

      const orderItems = await OrderItem.find({order: order.id})
      const orderHasRecurringPaymentItems = _.find(orderItems, {item_type: 'membership_type'})
      if (orderHasRecurringPaymentItems) {

        const recurringSession = await sails.helpers.paymentProvider.reepay.createRecurringSession(this.req.user.id)
        return exits.success({
          status: 'RECURRING_SESSION_CREATED',
          recurringSession: recurringSession,
          order: order
        })

      } else {

        await sails.helpers.order.processPaymentSettled(order)
        const processedOrder = await Order.findOne(order.id);
        return exits.success({
          status: 'ORDER_SETTLED',
          order: processedOrder
        })

      }

    }

    const chargeSession = await sails.helpers.paymentProvider.reepay.createChargeSession.with({
      order: order
    })

    return exits.success({
      status: 'CHARGE_SESSION_CREATED',
      chargeSession: chargeSession
    })

  },
}
