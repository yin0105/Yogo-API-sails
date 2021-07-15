const knex = require('../../../objection-models/knex-config')
const moment = require('moment-timezone')
module.exports = {
  friendlyName: 'Populate event time slots with event_is_fully_booked',

  inputs: {
    eventTimeSlots: {
      type: 'ref',
      description: 'The event time slots to populate',
      required: true,
    },
  },

  exits: {},

  fn: async function (inputs, exits) {

    // No time slots?
    if (!inputs.eventTimeSlots.length) {
      return exits.success([])
    }

    // Already populated?
    if (typeof inputs.eventTimeSlots[0].event_is_fully_booked !== 'undefined') {
      return exits.success(inputs.eventTimeSlots)
    }

    await sails.helpers.populate.eventTimeSlots.eventSignupCount(inputs.eventTimeSlots)

    _.each(inputs.eventTimeSlots, eventTimeSlot => {
      eventTimeSlot.event_is_fully_booked = eventTimeSlot.event.signup_count >= eventTimeSlot.event.seats
    })

    return exits.success(inputs.eventTimeSlots)

  },
}
