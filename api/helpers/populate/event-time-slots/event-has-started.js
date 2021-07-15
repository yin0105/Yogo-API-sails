const knex = require('../../../objection-models/knex-config')
const moment = require('moment-timezone')
module.exports = {
  friendlyName: 'Populate event time slots with user_is_signed_up_for_event',

  inputs: {
    eventTimeSlots: {
      type: 'ref',
      description: 'The event time slots to populate with event.signup_count',
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
    if (typeof inputs.eventTimeSlots[0].event_has_started !== 'undefined') {
      return exits.success(inputs.eventTimeSlots)
    }

    await sails.helpers.populate.eventTimeSlots.event(inputs.eventTimeSlots)

    _.each(inputs.eventTimeSlots, eventTimeSlot => {
      const eventStartDate = moment(eventTimeSlot.event.start_date).tz('Europe/Copenhagen')
      eventTimeSlot.event_has_started = moment().isAfter(eventStartDate, 'day')
    })

    return exits.success(inputs.eventTimeSlots)

  },
}
