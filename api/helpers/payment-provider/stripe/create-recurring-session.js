module.exports = {
  friendlyName: 'Create Reepay charge session',

  inputs: {
    user: {
      type: 'ref',
      required: true,
    },
  },

  fn: async (inputs, exits) => {

    const userId = sails.helpers.util.idOrObjectIdInteger(inputs.user)

    const user = await User.findOne(userId)

    const recurringSession = await sails.helpers.paymentProvider.reepay.api.checkout.with({
        client: user.client,
        method: 'POST',
        endpoint: '/session/recurring',
        body: {
          create_customer: {
            email: user.email,
            handle: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
          },
        },
      },
    )

    return exits.success(recurringSession)

  },
}
