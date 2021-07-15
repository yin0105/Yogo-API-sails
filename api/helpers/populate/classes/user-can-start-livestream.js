module.exports = {
  friendlyName: 'Populate Class.user_can_start_livestream',

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
    if (typeof inputs.classes[0].user_can_start_livestream !== 'undefined') {
      return exits.success(inputs.classes)
    }

    if (!inputs.user) {
      _.each(inputs.classes, cls => {
        cls.user_can_start_livestream = false
      })
      return exits.success(inputs.classes)
    }

    await sails.helpers.populate.classes.userIsSignedUpForLivestream(inputs.classes, inputs.user)
    await sails.helpers.populate.classes.classStartsToday(inputs.classes)
    await sails.helpers.populate.classes.classHasEnded(inputs.classes)

    for (let i = 0; i < inputs.classes.length; i++) {
      const cls = inputs.classes[i]

      cls.user_can_start_livestream =
        cls.user_is_signed_up_for_livestream &&
        cls.class_starts_today &&
        !cls.class_has_ended
    }

    return exits.success(inputs.classes)

  },
}
