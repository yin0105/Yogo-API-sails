const knex = require('../../../objection-models/knex-config')

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
    if (typeof inputs.membershipTypePaymentOptions[0].nameWithCampaignName !== 'undefined') {
      return exits.success(inputs.membershipTypePaymentOptions)
    }

    // Get membershipTypes and campaigns

    const membershipTypeIds = _.uniq(_.map(inputs.membershipTypePaymentOptions, paymentOption => {
      if (_.isObject(paymentOption.membership_type)) {
        return paymentOption.membership_type.id
      } else {
        return paymentOption.membership_type
      }
    }))
    const membershipTypes = await MembershipType.find({id: membershipTypeIds}).populate('active_campaign')
    const keyedMembershipTypes = _.keyBy(membershipTypes, 'id')

    _.each(inputs.membershipTypePaymentOptions, paymentOption => {
      if (parseInt(paymentOption.number_of_months_payment_covers) === 1) {
        const membershipTypeId = _.isObject(paymentOption.membership_type) ? paymentOption.membership_type.id : paymentOption.membership_type
        const activeCampaign = keyedMembershipTypes[membershipTypeId].active_campaign
        paymentOption.campaignPrice = activeCampaign.reduced_price
      } else {
        paymentOption.campaignPrice = paymentOption.payment_amount
      }
    })

    return exits.success(inputs.membershipTypePaymentOptions)

  },
}
