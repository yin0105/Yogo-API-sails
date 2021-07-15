module.exports = {

  friendlyName: 'Populate ClassPassType.max_number_per_customer_already_used',

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
    if (typeof inputs.classPassTypes[0].max_number_per_customer_already_used !== 'undefined') {
      return exits.success(inputs.classPassTypes)
    }

    if (!inputs.user) {
      _.each(inputs.classPassTypes, mt => {
        mt.max_number_per_customer_already_used = null
      })
      return exits.success(inputs.classPassTypes)
    }

    const userId = sails.helpers.util.idOrObjectIdInteger(inputs.user)

    const userClassPasses = await ClassPass.find({
      user: userId,
      archived: false,
    })

    _.each(inputs.classPassTypes, classPassType => {
      if (!classPassType.limited_number_per_customer) {
        classPassType.max_number_per_customer_already_used = false
        return
      }
      const classPasses = _.filter(userClassPasses, {class_pass_type: classPassType.id})
      classPassType.max_number_per_customer_already_used = classPasses.length >= classPassType.max_number_per_customer
    })

    return exits.success(inputs.classPassTypes)

  },
}
