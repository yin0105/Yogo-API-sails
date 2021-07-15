module.exports = {
  friendlyName: 'Populate Class.class_accepts_admin_signing_customer_up_for_livestream',

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
    if (typeof inputs.classes[0].class_accepts_admin_signing_customer_up_for_livestream !== 'undefined') {
      return exits.success(inputs.classes)
    }

    await sails.helpers.populate.classes.livestreamSignupCount(inputs.classes)

    await sails.helpers.populate.classes.classStartsTodayOrLater(inputs.classes)

    _.each(inputs.classes, cls => {

      cls.class_accepts_admin_signing_customer_up_for_livestream =
        !cls.archived &&
        cls.livestream_enabled &&
        !cls.cancelled &&
        cls.class_starts_today_or_later &&
        cls.livestream_signup_count < sails.config.fmLiveswitch.maxConnectionsPerSession - 1

    })

    return exits.success(inputs.classes)

  },
}
