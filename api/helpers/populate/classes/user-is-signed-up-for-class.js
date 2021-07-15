module.exports = {
  friendlyName: 'Populate Class.user_is_signed_up_for_class',

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
    if (typeof inputs.classes[0].user_is_signed_up_for_class !== 'undefined') {
      return exits.success(inputs.classes)
    }

    await sails.helpers.populate.classes.userSignupId(inputs.classes, inputs.user)

    _.each(inputs.classes, cls => {
      cls.user_is_signed_up_for_class = !!cls.user_signup_id
    })

    return exits.success(inputs.classes)

  },
}
