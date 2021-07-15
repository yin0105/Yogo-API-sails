const knex = require('../../../objection-models/knex-config')

const moment = require('moment-timezone')

module.exports = {
  friendlyName: 'Populate Class.user_can_sign_up_for_waiting_list',

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
    if (typeof inputs.classes[0].user_can_sign_up_for_waiting_list !== 'undefined') {
      return exits.success(inputs.classes)
    }

    if (!inputs.user) {
      _.each(inputs.classes, cls => {
        cls.user_can_sign_up_for_waiting_list = false
      })
      return exits.success(inputs.classes)
    }

    await sails.helpers.populate.classes.userHasAccessToClass(inputs.classes, inputs.user)
    await sails.helpers.populate.classes.classAcceptsWaitingListSignups(inputs.classes)
    await sails.helpers.populate.classes.userIsSignedUpForClass(inputs.classes, inputs.user)
    await sails.helpers.populate.classes.userIsSignedUpForWaitingList(inputs.classes, inputs.user)


    _.each(inputs.classes, cls => {

      cls.user_can_sign_up_for_waiting_list =
        cls.user_has_access_to_class &&
        cls.class_accepts_waiting_list_signups &&
        !cls.user_is_signed_up_for_class &&
        !cls.user_is_signed_up_for_waiting_list &&
        !cls.user_is_signed_up_for_livestream

    })

    return exits.success(inputs.classes)

  },
}
