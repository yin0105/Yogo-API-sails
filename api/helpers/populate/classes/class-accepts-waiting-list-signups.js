module.exports = {
  friendlyName: 'Populate Class.class_accepts_waiting_list_signups',

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
    if (typeof inputs.classes[0].class_accepts_waiting_list_signups !== 'undefined') {
      return exits.success(inputs.classes)
    }

    // Is waiting list enabled?
    const clientId = sails.helpers.util.idOrObjectIdInteger(inputs.classes[0].client_id || inputs.classes[0].client)

    const classWaitingListEnabled = await sails.helpers.clientSettings.find(clientId, 'class_waiting_list_enabled')
    const privateClassWaitingListEnabled = await sails.helpers.clientSettings.find(clientId, 'private_class_waiting_list_enabled')

    if (!classWaitingListEnabled && !privateClassWaitingListEnabled) {
      _.each(
        inputs.classes,
        cls => cls.class_accepts_waiting_list_signups = false,
      )
      return exits.success(inputs.classes)
    }

    await sails.helpers.populate.classes.classIsFullyBooked(inputs.classes)

    await sails.helpers.populate.classes.classSignupDeadlineHasBeenExceeded(inputs.classes)

    await sails.helpers.populate.classes.classSignoffDeadlineHasBeenExceeded(inputs.classes)

    await sails.helpers.populate.classes.classIsTooFarInTheFutureToSignUp(inputs.classes)

    await sails.helpers.populate.classes.waitingListIsFull(inputs.classes)

    await sails.helpers.populate.classes.classIsOpen(inputs.classes)

    _.each(inputs.classes, cls => {

      if (parseInt(cls.seats) === 1) {
        if (!privateClassWaitingListEnabled) {
          cls.class_accepts_waiting_list_signups = false
          return
        }
      } else {
        if (!classWaitingListEnabled) {
          cls.class_accepts_waiting_list_signups = false
          return
        }
      }

      if (cls.archived) {
        cls.class_accepts_waiting_list_signups = false
        return
      }
      if (cls.cancelled) {
        cls.class_accepts_waiting_list_signups = false
        return
      }
      if (cls.class_is_open) {
        cls.class_accepts_waiting_list_signups = false
        return
      }
      if (!cls.class_is_fully_booked) {
        cls.class_accepts_waiting_list_signups = false
        return
      }
      if (cls.waiting_list_is_full) {
        cls.class_accepts_waiting_list_signups = false
        return
      }

      if (cls.class_signup_deadline_has_been_exceeded) {
        cls.class_accepts_waiting_list_signups = false
        return
      }

      // Waiting lists are cleared after class signoff deadline
      if (cls.class_signoff_deadline_has_been_exceeded) {
        cls.class_accepts_waiting_list_signups = false
        return
      }

      if (cls.class_is_too_far_in_the_future_to_sign_up) {
        cls.class_accepts_waiting_list_signups = false
        return
      }

      cls.class_accepts_waiting_list_signups = true
    })

    return exits.success(inputs.classes)

  },
}
