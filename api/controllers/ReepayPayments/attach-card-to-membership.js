module.exports = {
  friendlyName: 'Attaches a newly entered card to an existing membership',

  inputs: {
    cardId: {
      type: 'string',
      required: true
    },
    membership: {
      type: 'number',
      required: true
    }
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

    if (!await sails.helpers.can2('controller.ReepayPayments.attach-card-to-membership', this.req)) {
      return exits.forbidden()
    }

    const membership = await Membership.findOne(inputs.membership)

    if (parseInt(this.req.user.id) !== parseInt(membership.user)) {
      return exits.forbidden()
    }

    const userPaymentMethods = await sails.helpers.paymentProvider.reepay.api.request.with({
      client: this.req.user.client,
      method: 'GET',
      endpoint: '/customer/' + this.req.user.id + '/payment_method?only_active=1'
    })

    console.log('userPaymentMethods:', userPaymentMethods)

    const reepayCard = _.find(userPaymentMethods.cards, upm => upm.id === inputs.cardId)
    if (!reepayCard) {
      return exits.cardIsNotAnActivePaymentMethodForThisUser('Card is not an active payment method for this user.')
    }

    await sails.helpers.paymentProvider.reepay.attachCardToMembership.with({
      card: reepayCard,
      membership: membership
    })

    return exits.success()

  },
}
