module.exports = {
  friendlyName: 'Populate payment option',

  inputs: {
    memberships: {
      type: 'ref',
      required: true,
    },
  },

  fn: async (inputs, exits) => {

    if (!inputs.memberships.length) {
      return exits.success([]);
    }

    if (inputs.memberships[0].payment_option && inputs.memberships[0].payment_option.id) {
      return exits.success();
    }

    const paymentOptionIds = _.compact(_.map(inputs.memberships, 'payment_option'));
    const paymentOptions = await MembershipPaymentOption.find({
        id: paymentOptionIds,
      })
    ;

    for (let i = 0; i < inputs.memberships.length; i++) {

      const membership = inputs.memberships[i];
      if (membership.payment_option) {
        membership.payment_option_id = membership.payment_option;
        membership.payment_option = _.find(paymentOptions, {id: membership.payment_option});
      } else {
        membership.payment_option_id = null;
      }

    }

    return exits.success();
  },
};
