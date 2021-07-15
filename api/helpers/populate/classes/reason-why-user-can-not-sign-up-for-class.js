////////////////////////
// WORK IN PROGRESS ///
//////////////////////
const knex = require('../../../objection-models/knex-config')

const moment = require('moment-timezone')
const t = sails.helpers.t

module.exports = {
  friendlyName: 'Populate Class.user_can_sign_up_for_class',

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
    if (typeof inputs.classes[0].reason_why_user_can_not_sign_up_for_class !== 'undefined') {
      return exits.success(inputs.classes)
    }

    if (!inputs.user) {
      _.each(inputs.classes, cls => {
        cls.user_can_sign_up_for_class = ''
      })
      return exits.success(inputs.classes)
    }

    const userId = sails.helpers.util.idOrObjectIdInteger(inputs.user)

    await sails.helpers.populate.classes.userCanSignUpForClass(inputs.classes, inputs.user)


    for (let i = 0; i < inputs.classes.length; i++) {
      const cls = inputs.classes[i]

      if (cls.user_can_sign_up_for_class) {
        cls.reason_why_user_can_not_sign_up_for_class = ''
        return
      }

      if (cls.user_is_signed_up_for_class) {
        cls.reason_why_user_can_not_sign_up_for_class = t('clasSignup.youAreSignedUp')
      } else if(cls.cancelled) {
        cls.reason_why_user_can_not_sign_up_for_class = t('clasSignup.classIsCancelled')
      } else if(cls.class_is_fully_booked) {
        cls.reason_why_user_can_not_sign_up_for_class = t('clasSignup.classIsFullyBooked')
      } else if(cls.class_signup_deadline_has_been_exceeded) {
        cls.reason_why_user_can_not_sign_up_for_class = t('clasSignup.signupMustHappenAtLeastXMinutesInAdvance')
      } else if(!cls.user_has_access_to_class) {
        cls.reason_why_user_can_not_sign_up_for_class = t('clasSignup.youDoNotHaveAccessToThisClass')
      }
    }

    return exits.success(inputs.classes)

  },
}
