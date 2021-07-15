module.exports = {
  friendlyName: 'Populate Class.class_accepts_admin_signing_customer_up',

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

    if (typeof inputs.classes[0].class_accepts_admin_signing_customer_up !== 'undefined') {
      return exits.success(inputs.classes)
    }

    await sails.helpers.populate.classes.classIsOpen(inputs.classes)

    await sails.helpers.populate.classes.classStartsTodayOrLater(inputs.classes)

    _.each(inputs.classes, cls => {

      cls.class_accepts_admin_signing_customer_up =
        !cls.archived &&
        cls.studio_attendance_enabled &&
        !cls.cancelled &&
        !cls.class_is_open &&
        cls.class_starts_today_or_later

    })

    return exits.success(inputs.classes)

  },
}
