module.exports = {
  friendlyName: 'Populate Class.admin_can_sign_user_up_for_livestream',

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
    if (typeof inputs.classes[0].admin_can_sign_user_up_for_livestream !== 'undefined') {
      return exits.success(inputs.classes)
    }

    if (!inputs.user) {
      _.each(inputs.classes, cls => {
        cls.admin_can_sign_user_up_for_livestream = false
      })
      return exits.success(inputs.classes)
    }

    await sails.helpers.populate.classes.userHasAccessToLivestream(inputs.classes, inputs.user)

    await sails.helpers.populate.classes.classAcceptsAdminSigningCustomerUpForLivestream(inputs.classes)

    await sails.helpers.populate.classes.userIsSignedUpForClass(inputs.classes, inputs.user)

    await sails.helpers.populate.classes.userIsSignedUpForWaitingList(inputs.classes, inputs.user)

    await sails.helpers.populate.classes.userIsSignedUpForLivestream(inputs.classes, inputs.user)

    for (let i = 0; i < inputs.classes.length; i++) {
      const cls = inputs.classes[i]

      cls.admin_can_sign_user_up_for_livestream =
        cls.user_has_access_to_livestream &&
        cls.class_accepts_admin_signing_customer_up_for_livestream &&
        !cls.user_is_signed_up_for_class &&
        !cls.user_is_signed_up_for_waiting_list &&
        !cls.user_is_signed_up_for_livestream
    }

    return exits.success(inputs.classes)

  },
}
