const knex = require('../../../objection-models/knex-config')

module.exports = {
  friendlyName: 'Populate event time slots with events',

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
    if (_.isObject(inputs.eventTimeSlots[0].event)) {
      return exits.success(inputs.eventTimeSlots)
    }

    let eventIds
    if (inputs.eventTimeSlots[0].event_id) {
      eventIds = _.map(inputs.eventTimeSlots, 'event_id')
    } else {
      eventIds = _.map(inputs.eventTimeSlots, 'event')
    }

    const events = await knex({e: 'event'}).where('id', 'in',eventIds)

    _.each(inputs.eventTimeSlots, eventTimeSlot => {
      if (inputs.eventTimeSlots[0].event_id) {
        eventTimeSlot.event = _.find(events, e => e.id == eventTimeSlot.event_id)
      } else {
        eventTimeSlot.event = _.find(events, e => e.id == eventTimeSlot.event)
      }
    })

    return exits.success(inputs.eventTimeSlots)

  },
}
