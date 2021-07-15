const knex = require('../../../objection-models/knex-config')

module.exports = {
  friendlyName: 'Populate event time slots with user_can_sign_up_for_event',

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
    if (typeof inputs.eventTimeSlots[0].user_can_sign_up_for_event !== 'undefined') {
      return exits.success(inputs.eventTimeSlots)
    }

    await sails.helpers.populate.eventTimeSlots.eventAcceptsCustomerSignups(inputs.eventTimeSlots)
    await sails.helpers.populate.eventTimeSlots.userIsSignedUpForEvent(inputs.eventTimeSlots, inputs.user)

    _.each(inputs.eventTimeSlots, eventTimeSlot => {
      eventTimeSlot.user_can_sign_up_for_event =
        eventTimeSlot.event_accepts_customer_signups &&
        !eventTimeSlot.user_is_signed_up_for_event
    })

    return exits.success(inputs.eventTimeSlots)

  },
}
