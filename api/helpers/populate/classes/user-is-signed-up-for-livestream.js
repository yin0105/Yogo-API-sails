module.exports = {
  friendlyName: 'Populate Class.user_is_signed_up_for_livestream',

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
    if (typeof inputs.classes[0].user_is_signed_up_for_livestream !== 'undefined') {
      return exits.success(inputs.classes)
    }

    await sails.helpers.populate.classes.userLivestreamSignupId(inputs.classes, inputs.user)

    _.each(inputs.classes, cls => {
      cls.user_is_signed_up_for_livestream = !!cls.user_livestream_signup_id
    })

    return exits.success(inputs.classes)

  },
}
