module.exports = {
  friendlyName: 'Populate Class.class_accepts_customer_signups',

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

    // Already populated??
    if (typeof inputs.classes[0].class_accepts_customer_signups !== 'undefined') {
      return exits.success(inputs.classes)
    }

    // We need Class.signup_count
    await sails.helpers.populate.classes.signupCount(inputs.classes)

    // and Class.class_is_fully_booked
    await sails.helpers.populate.classes.classIsFullyBooked(inputs.classes)

    // and Class.class_signup_deadline_has_been_exceeded
    await sails.helpers.populate.classes.classSignupDeadlineHasBeenExceeded(inputs.classes)

    // and Class.class_is_too_far_in_the_future_to_sign_up
    await sails.helpers.populate.classes.classIsTooFarInTheFutureToSignUp(inputs.classes)

    // and Class.class_is_open
    await sails.helpers.populate.classes.classIsOpen(inputs.classes)

    _.each(inputs.classes, cls => {

      cls.class_accepts_customer_signups =
        !cls.archived &&
        cls.studio_attendance_enabled &&
        !cls.cancelled &&
        !cls.class_is_open &&
        !cls.class_is_fully_booked &&
        !cls.class_signup_deadline_has_been_exceeded &&
        !cls.class_is_too_far_in_the_future_to_sign_up

    })

    return exits.success(inputs.classes)

  },
}
