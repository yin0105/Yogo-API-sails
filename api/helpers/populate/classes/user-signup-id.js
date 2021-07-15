const knex = require('../../../objection-models/knex-config')

module.exports = {
  friendlyName: 'Populate Class.user_signup_id',

  inputs: {
    classes: {
      type: 'ref',
      description: 'An array of classes to populate',
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

    // Already populated??
    if (typeof inputs.classes[0].user_signup_id !== 'undefined') {
      return exits.success(inputs.classes)
    }

    if (!inputs.user) {
      _.each(inputs.classes, cls => {
        cls.user_signup_id = null
      })
      return exits.success(inputs.classes)
    }

    const userId = sails.helpers.util.idOrObjectIdInteger(inputs.user)

    const classIds = _.map(inputs.classes, 'id')

    const signups = await knex({cs: 'class_signup'})
      .where('cs.class', 'in', classIds)
      .andWhere('cs.user', userId)
      .andWhere('cs.archived', false)
      .andWhere('cs.cancelled_at', 0)

    _.each(inputs.classes, cls => {
      const signup = _.find(signups, signup => signup.class == cls.id)
      cls.user_signup_id = signup ? signup.id : null
    })

    return exits.success(inputs.classes)

  },
}
