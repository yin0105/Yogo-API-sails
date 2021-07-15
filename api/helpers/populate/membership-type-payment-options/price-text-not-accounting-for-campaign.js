const currencyDkk = require('../../../filters/currency_dkk')

module.exports = {

  friendlyName: 'Populate MembershipTypePaymentOption.priceTextNotAccountingForCampaign',

  inputs: {
    membershipTypePaymentOptions: {
      type: 'ref',
      description: 'The payment options to populate',
      required: true,
    },
  },

  fn: async function (inputs, exits) {

    // No time slots?
    if (!inputs.membershipTypePaymentOptions.length) {
      return exits.success([])
    }

    // Already populated?
    if (typeof inputs.membershipTypePaymentOptions[0].priceTextNotAccountingForCampaign !== 'undefined') {
      return exits.success(inputs.membershipTypePaymentOptions)
    }


    _.each(inputs.membershipTypePaymentOptions, paymentOption => {
        paymentOption.priceTextNotAccountingForCampaign = currencyDkk(paymentOption.payment_amount) + ' kr'
    })

    return exits.success(inputs.membershipTypePaymentOptions)

  },
}
