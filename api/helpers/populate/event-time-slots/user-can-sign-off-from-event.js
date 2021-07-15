const knex = require('../../../objection-models/knex-config')

module.exports = {
  friendlyName: 'Populate event time slots with user_can_sign_off_from_event',

  inputs: {
    eventTimeSlots: {
      type: 'ref',
      description: 'The event time slots to populate',
      required: true,
    },
    user: {
      type: 'ref',
      description: 'The user to check',
      required: false
    }
  },

  exits: {},

  fn: async function (inputs, exits) {

    // No time slots?
    if (!inputs.eventTimeSlots.length) {
      return exits.success([])
    }

    // Already populated?
    if (typeof inputs.eventTimeSlots[0].user_can_sign_off_from_event !== 'undefined') {
      return exits.success(inputs.eventTimeSlots)
    }

    await sails.helpers.populate.eventTimeSlots.event(inputs.eventTimeSlots)
    await sails.helpers.populate.eventTimeSlots.eventHasStarted(inputs.eventTimeSlots)
    await sails.helpers.populate.eventTimeSlots.userIsSignedUpForEvent(inputs.eventTimeSlots, inputs.user)

    _.each(inputs.eventTimeSlots, eventTimeSlot => {
      eventTimeSlot.user_can_sign_off_from_event =
        eventTimeSlot.user_is_signed_up_for_event &&
        !eventTimeSlot.event_has_started &&
        parseFloat(eventTimeSlot.event.price) === 0
    })

    return exits.success(inputs.eventTimeSlots)

  },
}
