module.exports = {

  friendlyName: 'Populate ClassPassType.user_can_buy',

  inputs: {
    classPassTypes: {
      type: 'ref',
      description: 'The class pass types to populate',
      required: true,
    },
    user: {
      type: 'ref',
      description: 'The user to populate for',
      required: false,
    },
  },

  fn: async function (inputs, exits) {

    // No class pass types?
    if (!inputs.classPassTypes.length) {
      return exits.success([])
    }

    // Already populated?
    if (typeof inputs.classPassTypes[0].user_can_buy !== 'undefined') {
      return exits.success(inputs.classPassTypes)
    }

    if (!inputs.user) {
      _.each(inputs.classPassTypes, mt => {
        mt.user_can_buy = null
      })
      return exits.success(inputs.classPassTypes)
    }

    await sails.helpers.populate.classPassTypes.maxNumberPerCustomerAlreadyUsed(inputs.classPassTypes, inputs.user)

    _.each(inputs.classPassTypes, classPassType => {
      classPassType.user_can_buy = !classPassType.max_number_per_customer_already_used
    })

    return exits.success(inputs.classPassTypes)

  },
}
