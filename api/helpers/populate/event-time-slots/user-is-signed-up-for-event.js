module.exports = {
  friendlyName: 'Populate event time slots with user_is_signed_up_for_event',

  inputs: {
    eventTimeSlots: {
      type: 'ref',
      description: 'The event time slots to populate with event.signup_count',
      required: true,
    },
    user: {
      type: 'ref',
      description: 'The user to check signup for',
      required: false,
    },
  },

  exits: {},

  fn: async function (inputs, exits) {

    // No time slots?
    if (!inputs.eventTimeSlots.length) {
      return exits.success([])
    }

    // Already populated?
    if (typeof inputs.eventTimeSlots[0].user_is_signed_up_for_event !== 'undefined') {
      return exits.success(inputs.eventTimeSlots)
    }

    await sails.helpers.populate.eventTimeSlots.userSignupId(inputs.eventTimeSlots, inputs.user)

    // No user?
    if (!inputs.user) {
      _.each(inputs.eventTimeSlots, eventTimeSlot => {
        eventTimeSlot.user_is_signed_up_for_event = false
      })
      return exits.success(inputs.eventTimeSlots)
    }

    _.each(inputs.eventTimeSlots, eventTimeSlot => {
      eventTimeSlot.user_is_signed_up_for_event = !!eventTimeSlot.user_signup_id
    })

    return exits.success(inputs.eventTimeSlots)

  },
}
