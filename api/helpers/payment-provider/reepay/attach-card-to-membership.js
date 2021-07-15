module.exports = {
  friendlyName: 'Attach credit card to membership',

  inputs: {
    card: {
      type: 'json',
      required: true,
    },
    membership: {
      type: 'ref',
      required: true,
    },
  },

  fn: async (inputs, exits) => {

    const membershipId = sails.helpers.util.idOrObjectIdInteger(inputs.membership)
    const membership = await Membership.findOne(membershipId).populate('payment_subscriptions')

    await PaymentSubscription.update({id: _.map(membership.payment_subscriptions, 'id')}, {status: 'stopped'})

    await PaymentSubscription.create({
      client: membership.client,
      membership: membership.id,
      status: 'active',
      payment_service_provider: 'reepay',
      payment_provider_subscription_id: inputs.card.id,
      pay_type: inputs.card.card_type,
      card_last_4_digits: inputs.card.masked_card.substr(12, 4),
      card_expiration: inputs.card.exp_date.replace('-', '/'),
      card_nomask: inputs.card.masked_card,
      card_prefix: inputs.card.masked_card.substr(0, 6),
    })

    return exits.success()

  },
}
