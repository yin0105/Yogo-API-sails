module.exports = {
  friendlyName: 'Populate Class.user_must_receive_warning_after_signoff_deadline',

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
    if (typeof inputs.classes[0].user_must_receive_warning_after_signoff_deadline !== 'undefined') {
      return exits.success(inputs.classes)
    }

    _.each(inputs.classes, cls => {
      cls.user_must_receive_warning_after_signoff_deadline = true;
    })

    return exits.success(inputs.classes)

  },
}
