module.exports = {
  friendlyName: 'Populate Class.admin_can_sign_user_off_from_livestream',

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
    if (typeof inputs.classes[0].admin_can_sign_user_off_from_livestream !== 'undefined') {
      return exits.success(inputs.classes)
    }

    if (!inputs.user) {
      _.each(inputs.classes, cls => {
        cls.admin_can_sign_user_off_from_livestream = false
      })
      return exits.success(inputs.classes)
    }

    await sails.helpers.populate.classes.userIsSignedUpForLivestream(inputs.classes, inputs.user)
    await sails.helpers.populate.classes.classStartsTodayOrLater(inputs.classes)


    for (let i = 0; i < inputs.classes.length; i++) {
      const cls = inputs.classes[i]

      cls.admin_can_sign_user_off_from_livestream =
        cls.user_is_signed_up_for_livestream &&
        cls.class_starts_today_or_later &&
        !cls.archived &&
        !cls.cancelled
    }

    return exits.success(inputs.classes)

  },
}
