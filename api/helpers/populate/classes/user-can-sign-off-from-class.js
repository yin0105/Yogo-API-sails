module.exports = {
  friendlyName: 'Populate Class.user_can_sign_off_from_class',

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
    if (typeof inputs.classes[0].user_can_sign_off_from_class !== 'undefined') {
      return exits.success(inputs.classes)
    }

    if (!inputs.user) {
      _.each(inputs.classes, cls => {
        cls.user_can_sign_off_from_class = false
      })
      return exits.success(inputs.classes)
    }

    await sails.helpers.populate.classes.userIsSignedUpForClass(inputs.classes, inputs.user)
    await sails.helpers.populate.classes.classHasStarted(inputs.classes)


    for (let i = 0; i < inputs.classes.length; i++) {
      const cls = inputs.classes[i]

      cls.user_can_sign_off_from_class =
        cls.user_is_signed_up_for_class &&
        !cls.class_has_started &&
        !cls.archived &&
        !cls.cancelled
    }

    return exits.success(inputs.classes)

  },
}
