module.exports = {
  friendlyName: 'Populate Class.class_accepts_livestream_signups',

  inputs: {
    classes: {
      type: 'ref',
      description: 'An array of classes to populate',
      required: true,
    },
  },

  fn: async function (inputs, exits) {

    if (!inputs.classes.length) {
      return exits.success([])
    }

    if (typeof inputs.classes[0].class_accepts_livestream_signups !== 'undefined') {
      return exits.success(inputs.classes)
    }

    await sails.helpers.populate.classes.livestreamSignupCount(inputs.classes)

    await sails.helpers.populate.classes.classSignupDeadlineHasBeenExceeded(inputs.classes)

    await sails.helpers.populate.classes.classIsTooFarInTheFutureToSignUp(inputs.classes)


    _.each(inputs.classes, cls => {

      cls.class_accepts_livestream_signups =
        !cls.archived &&
        cls.livestream_enabled &&
        !cls.cancelled &&
        !cls.class_signup_deadline_has_been_exceeded &&
        !cls.class_is_too_far_in_the_future_to_sign_up &&
        cls.livestream_signup_count < sails.config.fmLiveswitch.maxConnectionsPerSession - 1

    })

    return exits.success(inputs.classes)

  },
}
