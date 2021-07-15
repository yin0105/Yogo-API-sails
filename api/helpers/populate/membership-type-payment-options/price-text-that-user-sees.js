module.exports = {

  friendlyName: 'Populate MembershipTypePaymentOption.nameWithCampaignName',

  inputs: {
    membershipTypePaymentOptions: {
      type: 'ref',
      description: 'The payment options to populate',
      required: true,
    },
    user: {
      type: 'ref',
      description: 'The user to populate for',
      required: false
    }
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

    await sails.helpers.populate.membershipTypePaymentOptions.priceTextNotAccountingForCampaign(inputs.membershipTypePaymentOptions)
    await sails.helpers.populate.membershipTypePaymentOptions.priceTextAccountingForCampaign(inputs.membershipTypePaymentOptions)

    let keyedMembershipTypes
    if (inputs.user) {
      const membershipTypeIds = _.uniq(
        _.map(inputs.membershipTypePaymentOptions, paymentOption => sails.helpers.util.idOrObjectIdInteger(paymentOption.membership_type))
      )
      const membershipTypes = await MembershipType.find({id: membershipTypeIds})
      await sails.helpers.populate.membershipTypes.userIsEligibleForCampaign(membershipTypes, inputs.user)

      keyedMembershipTypes = _.keyBy(membershipTypes, 'id')
    }

    _.each(inputs.membershipTypePaymentOptions, paymentOption => {
      if (!inputs.user) {
        paymentOption.priceTextThatUserSees = paymentOption.priceTextAccountingForCampaign
        return
      }
      const membershipTypeId = sails.helpers.util.idOrObjectIdInteger(paymentOption.membership_type)
      const userIsEligibleForCampaign = keyedMembershipTypes[membershipTypeId].userIsEligibleForCampaign

      paymentOption.priceTextThatUserSees = userIsEligibleForCampaign ? paymentOption.priceTextAccountingForCampaign : paymentOption.priceTextNotAccountingForCampaign
    })

    return exits.success(inputs.membershipTypePaymentOptions)

  },
}
