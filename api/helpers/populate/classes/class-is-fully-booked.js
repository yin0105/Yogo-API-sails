module.exports = {
  friendlyName: 'Populate Class.class_is_fully_booked',

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
    if (typeof inputs.classes[0].class_is_fully_booked !== 'undefined') {
      return exits.success(inputs.classes)
    }

    // We need Class.signup_count
    await sails.helpers.populate.classes.signupCount(inputs.classes)

    _.each(inputs.classes, cls => {
      if (parseInt(cls.seats) === 0) {
        cls.class_is_fully_booked = false
        return
      }
      cls.class_is_fully_booked = cls.signup_count >= cls.seats
    })

    return exits.success(inputs.classes)

  },
}
