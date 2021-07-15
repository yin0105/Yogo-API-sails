module.exports = {

  friendlyName: 'Populate MembershipTypePaymentOption.nameWithCampaignName',

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
    if (typeof inputs.membershipTypePaymentOptions[0].nameAccountingForCampaign !== 'undefined') {
      return exits.success(inputs.membershipTypePaymentOptions)
    }

    // Get membershipTypes and campaigns

    const membershipTypeIds = _.uniq(
      _.map(inputs.membershipTypePaymentOptions, paymentOption => sails.helpers.util.idOrObjectIdInteger(paymentOption.membership_type))
    )
    const membershipTypes = await MembershipType.find({id: membershipTypeIds}).populate('active_campaign')
    const keyedMembershipTypes = _.keyBy(membershipTypes, 'id')

    _.each(inputs.membershipTypePaymentOptions, paymentOption => {

      const membershipTypeId = sails.helpers.util.idOrObjectIdInteger(paymentOption.membership_type)
      const activeCampaign = keyedMembershipTypes[membershipTypeId].active_campaign

      if (parseInt(paymentOption.number_of_months_payment_covers) === 1 && activeCampaign) {
        paymentOption.nameAccountingForCampaign = paymentOption.name + (activeCampaign ? ' - ' + activeCampaign.name : '')
      } else {
        paymentOption.nameAccountingForCampaign = paymentOption.name
      }
    })

    return exits.success(inputs.membershipTypePaymentOptions)

  },
}
