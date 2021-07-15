module.exports = {

  friendlyName: 'Populate MembershipTypePaymentOption.nameThatUserSees',

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
    if (typeof inputs.membershipTypePaymentOptions[0].nameThatUserSees !== 'undefined') {
      return exits.success(inputs.membershipTypePaymentOptions)
    }

    await sails.helpers.populate.membershipTypePaymentOptions.nameAccountingForCampaign(inputs.membershipTypePaymentOptions)

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
        paymentOption.nameThatUserSees = paymentOption.nameAccountingForCampaign
        return
      }
      const membershipTypeId = sails.helpers.util.idOrObjectIdInteger(paymentOption.membership_type)
      const userIsEligibleForCampaign = keyedMembershipTypes[membershipTypeId].userIsEligibleForCampaign
      paymentOption.nameThatUserSees = userIsEligibleForCampaign ? paymentOption.nameAccountingForCampaign : paymentOption.name
    })

    return exits.success(inputs.membershipTypePaymentOptions)

  },
}
