module.exports = {
  friendlyName: 'Attaches a newly entered card to an existing membership',

  inputs: {
    paymentIntentId: {
      type: 'string',
      required: true,
    },
    customerId: {
      type: 'string',
      required: true,
    },
    membership: {
      type: 'string',
      required: false,
    },
  },

  exits: {
    forbidden: {
      responseType: 'forbidden',
    },
    cardIsNotAnActivePaymentMethodForThisUser: {
      responseType: 'badRequest'
    }
  },

  fn: async function (inputs, exits) {

    console.log("inputs = ", inputs);
    // if (!await sails.helpers.can2('controller.StripePayments.attach-card-to-membership', this.req)) {
    //   return exits.forbidden()
    // }

    const membership = await Membership.findOne(inputs.membership)

    if (parseInt(this.req.user.id) !== parseInt(membership.user)) {
      return exits.forbidden()
    }

    // const userPaymentMethods = await sails.helpers.paymentProvider.stripe.api.request.with({
    //   client: this.req.user.client,
    //   method: 'GET',
    //   endpoint: '/customer/' + this.req.user.id + '/payment_method?only_active=1'
    // })

    // console.log('userPaymentMethods:', userPaymentMethods)

    // const stripeCard = _.find(userPaymentMethods.cards, upm => upm.id === inputs.cardId)
    // if (!stripeCard) {
    //   return exits.cardIsNotAnActivePaymentMethodForThisUser('Card is not an active payment method for this user.')
    // }

    await sails.helpers.paymentProvider.stripe.attachCardToMembership.with({
      paymentIntentId: inputs.paymentIntentId,
      customerId: inputs.customerId,
      membership: membership
    })

    return exits.success()

  },
}
