const currencyDkk = require('../../../filters/currency_dkk')

module.exports = {

  friendlyName: 'Populate MembershipTypePaymentOption.priceTextAccountingForCampaign',

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
    if (typeof inputs.membershipTypePaymentOptions[0].priceTextAccountingForCampaign !== 'undefined') {
      return exits.success(inputs.membershipTypePaymentOptions)
    }


    await sails.helpers.populate.membershipTypePaymentOptions.priceTextNotAccountingForCampaign(inputs.membershipTypePaymentOptions)

    // Get membershipTypes and campaigns
    const membershipTypeIds = _.uniq(_.map(inputs.membershipTypePaymentOptions, paymentOption => sails.helpers.util.idOrObjectIdInteger(paymentOption.membership_type)))
    const membershipTypes = await MembershipType.find({id: membershipTypeIds}).populate('active_campaign')
    const keyedMembershipTypes = _.keyBy(membershipTypes, 'id')

    _.each(inputs.membershipTypePaymentOptions, paymentOption => {

      const membershipTypeId = sails.helpers.util.idOrObjectIdInteger(paymentOption.membership_type)
      const activeCampaign = keyedMembershipTypes[membershipTypeId].active_campaign

      if (!activeCampaign || parseInt(paymentOption.number_of_months_payment_covers) !== 1) {
        paymentOption.priceTextAccountingForCampaign = paymentOption.priceTextNotAccountingForCampaign
        return
      }

      paymentOption.priceTextAccountingForCampaign = sails.helpers.t('price.' +
        (
          parseInt(activeCampaign.number_of_months_at_reduced_price) === 1 ? (
              parseInt(activeCampaign.reduced_price) === 0 ?
                'campaignPriceTextOneMonthFree' :
                'campaignPriceTextOneMonthReducedPrice') :
            (parseInt(activeCampaign.reduced_price) === 0 ?
              'campaignPriceTextMultipleMonthsFree' :
              'campaignPriceTextMultipleMonthsReducedPrice')
        ),
        {
          months: activeCampaign.number_of_months_at_reduced_price,
          reduced_price: currencyDkk(activeCampaign.reduced_price),
          price: currencyDkk(paymentOption.payment_amount),
        },
      )

    })

    return exits.success(inputs.membershipTypePaymentOptions)

  },
}
