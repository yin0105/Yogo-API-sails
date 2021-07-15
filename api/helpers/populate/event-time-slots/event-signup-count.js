const knex = require('../../../objection-models/knex-config')

module.exports = {
  friendlyName: 'Populate event time slots events, signup count',

  description: 'Counts the signups for the event that the time slot is for',

  inputs: {
    eventTimeSlots: {
      type: 'ref',
      description: 'The event time slots to populate with event.signup_count',
      required: true,
    },
  },

  exits: {
    eventsAreNotPopulated: {
      description: 'Time slots must already have events populated',
    },
  },

  fn: async function (inputs, exits) {

    // No time slots?
    if (!inputs.eventTimeSlots.length) {
      return exits.success([])
    }

    // Events not populated?
    await sails.helpers.populate.eventTimeSlots.event(inputs.eventTimeSlots)

    // Already populated signup_count?
    if (typeof inputs.eventTimeSlots[0].event.signup_count !== 'undefined') {
      return exits.success(inputs.eventTimeSlots)
    }

    // Are signups populated? If so, just count them.
    if (_.isObject(inputs.eventTimeSlots[0].event) && typeof inputs.eventTimeSlots[0].event.signups !== 'undefined') {
      _.each(inputs.eventTimeSlots, eventTimeSlot => {
        eventTimeSlot.event.signup_count = eventTimeSlot.event.signups.length
      })
    } else {
      // If not, query DB
      const eventIds = _.map(inputs.eventTimeSlots, eventTimeSlot => eventTimeSlot.event.id)
      const signupCounts = await knex({e: 'event'})
        .select([
          'e.id',
          knex.raw('COUNT(es.id) AS signup_count'),
        ])
        .where('e.id', 'in', eventIds)
        .innerJoin({es: 'event_signup'}, 'es.event', 'e.id')
        .innerJoin({u: 'user'}, 'es.user', 'u.id')
        .andWhere('es.archived', false)
        .andWhere('u.archived', false)
        .groupBy('e.id')

      _.each(inputs.eventTimeSlots, eventTimeSlot => {
        const row = _.find(signupCounts, row => row.id == eventTimeSlot.event.id)
        eventTimeSlot.event.signup_count = row ? row.signup_count : 0
      })
    }

    return exits.success(inputs.eventTimeSlots)

  },
}
