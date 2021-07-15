module.exports = {
  friendlyName: 'Populate Class.class_is_open',

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
    if (typeof inputs.classes[0].class_is_open !== 'undefined') {
      return exits.success(inputs.classes)
    }

    _.each(inputs.classes, cls => {

      cls.class_is_open = parseInt(cls.seats) === 0

    })

    return exits.success(inputs.classes)

  },
}
