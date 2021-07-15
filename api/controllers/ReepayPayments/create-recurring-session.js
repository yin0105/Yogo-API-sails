module.exports = {
  friendlyName: 'Create an order and a new recurring session with Reepay',

  inputs: {

  },

  exits: {
    forbidden: {
      responseType: 'forbidden',
    },
  },

  fn: async function (inputs, exits) {

    if (!await sails.helpers.can2('controller.ReepayPayments.create-recurring-session', this.req)) {
      return exits.forbidden()
    }

    const recurringSession = await sails.helpers.paymentProvider.reepay.createRecurringSession.with({
      user: this.req.user.id
    })

    return exits.success(recurringSession)

  },
}
