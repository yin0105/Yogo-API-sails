const knex = require('../../../objection-models/knex-config')

module.exports = {
  friendlyName: 'Populate event time slots with user_signup_id',

  inputs: {
    eventTimeSlots: {
      type: 'ref',
      description: 'The event time slots to populate',
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

    // No user?
    if (!inputs.user) {
      _.each(inputs.eventTimeSlots, eventTimeSlot => {
        eventTimeSlot.user_signup_id = false
      })
      return exits.success(inputs.eventTimeSlots)
    }

    const eventIds = _.map(inputs.eventTimeSlots, 'event_id')
    const userId = sails.helpers.util.idOrObjectIdInteger(inputs.user)

    const userSignups = await knex({es: 'event_signup'})
      .where({
        'es.user': userId,
        'es.archived': false,
      })
      .andWhere('es.event', 'in', eventIds)

    _.each(inputs.eventTimeSlots, eventTimeSlot => {
      const signup = _.find(userSignups, userSignup => userSignup.event == eventTimeSlot.event_id)
      eventTimeSlot.user_signup_id = signup ? signup.id : null
    })

    return exits.success(inputs.eventTimeSlots)

  },
}
