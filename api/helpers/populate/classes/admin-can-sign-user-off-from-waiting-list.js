module.exports = {
  friendlyName: 'Populate Class.admin_can_sign_user_off_from_waiting_list',

  inputs: {
    classes: {
      type: 'ref',
      description: 'An array of classes to populate',
      required: true,
    },
    user: {
      type: 'json',
      description: 'The current user',
      required: false,
    },
  },

  fn: async function (inputs, exits) {

    if (!inputs.classes.length) {
      return exits.success([])
    }

    // Already populated??
    if (typeof inputs.classes[0].admin_can_sign_user_off_from_waiting_list !== 'undefined') {
      return exits.success(inputs.classes)
    }

    if (!inputs.user) {
      _.each(inputs.classes, cls => {
        cls.admin_can_sign_user_off_from_waiting_list = false
      })
      return exits.success(inputs.classes)
    }

    await sails.helpers.populate.classes.userIsSignedUpForWaitingList(inputs.classes, inputs.user)


    _.each(inputs.classes, cls => {

      cls.admin_can_sign_user_off_from_waiting_list = cls.user_is_signed_up_for_waiting_list

    })

    return exits.success(inputs.classes)

  },
}
