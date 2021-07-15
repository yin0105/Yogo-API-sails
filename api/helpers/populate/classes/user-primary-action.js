module.exports = {
  friendlyName: 'User primary action',

  description: 'Calculates the text and the url for the primary action button on the class',

  inputs: {
    classes: {
      type: 'ref',
      description: 'The classes to populate with',
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

    if (typeof inputs.classes[0].user_primary_action !== 'undefined') {
      return exits.success(inputs.classes)
    }

    if (!inputs.user) {
      _.each(inputs.classes, cls => {
        cls.user_primary_action = {
          label: 'See prices',
          action: '_PRICES_',
        }
      })
      return exits.success(inputs.classes)
    }

    await sails.helpers.populate.classes.userCanSignUpForClass(inputs.classes, inputs.user)
    await sails.helpers.populate.classes.userCanSignOffFromClass(inputs.classes, inputs.user)
    await sails.helpers.populate.classes.userCanSignUpForWaitingList(inputs.classes, inputs.user)
    await sails.helpers.populate.classes.userCanSignOffFromWaitingList(inputs.classes, inputs.user)
    await sails.helpers.populate.classes.userNumberOnWaitingList(inputs.classes, inputs.user)


    const userId = sails.helpers.util.idOrObjectIdInteger(inputs.user)
    const classSignupAction = {
      method: 'post',
      endpoint: sails.config.baseUrl + '/class-signups',
      body: {
        user: userId,
      },
      type: 'CLASS_SIGNUP'
    }
    const classSignoffAction = {
      method: 'delete',
      endpoint: sails.config.baseUrl + '/class-signups/',
      type: 'CLASS_SIGNOFF'
    }
    const waitingListSignupAction = {
      method: 'post',
      endpoint: sails.config.baseUrl + '/class-waiting-list-signups',
      body: {
        user: userId,
      },
      type: 'WAITING_LIST_SIGNUP'
    }
    const waitingListSignoffAction = {
      method: 'delete',
      endpoint: sails.config.baseUrl + '/class-waiting-list-signups/',
      type: 'WAITING_LIST_SIGNOFF'
    }

    await Promise.all(_.map(inputs.classes, async cls => {

      if (cls.user_can_sign_up_for_class) {
        cls.user_primary_action = {
          label: 'Sign up',
          action: _.cloneDeep(classSignupAction),
        }
        cls.user_primary_action.action.body.class = cls.id
        return
      }

      if (cls.user_can_sign_off_from_class) {
        cls.user_primary_action = {
          label: 'Sign off',
          action: _.cloneDeep(classSignoffAction),
        }
        cls.user_primary_action.action.endpoint += cls.user_signup_id
        return
      }

      if (cls.user_can_sign_up_for_waiting_list) {
        cls.user_primary_action = {
          label: 'Sign up for waiting list',
          action: _.cloneDeep(waitingListSignupAction),
        }
        cls.user_primary_action.action.body.class = cls.id
        return
      }

      if (cls.user_can_sign_off_from_waiting_list) {
        cls.user_primary_action = {
          label: 'Sign off from waiting list',
          action: _.cloneDeep(waitingListSignoffAction),
        }
        cls.user_primary_action.action.endpoint += cls.user_waiting_list_signup_id
        return
      }

      if (cls.cancelled) {
        cls.user_primary_action = {
          label: 'Class cancelled',
        }
        return
      }

      if (cls.user_is_signed_up_for_class) {
        cls.user_primary_action = {
          label: 'You are signed up',
        }
        return
      }

      if (cls.user_is_signed_up_for_waiting_list) {
        cls.user_primary_action = {
          label: 'You are number ' + cls.user_number_on_waiting_list + ' on the waiting list',
        }
        return
      }

      if (cls.class_has_started) {
        cls.user_primary_action = {
          label: 'Class has started',
        }
        return
      }

      if (cls.class_is_full) {
        cls.user_primary_action = {
          label: 'Class is full',
        }
        return
      }

      // TODO: Maybe message that user has no access pass. Or communicate it in another way.

      cls.user_primary_action = {
        label: 'See prices',
        action: '_PRICES_',
      }

    }))

    return exits.success(inputs.classes)

  },
}
