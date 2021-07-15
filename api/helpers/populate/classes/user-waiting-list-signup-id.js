const knex = require('../../../objection-models/knex-config')

module.exports = {
  friendlyName: 'Populate Class.user_waiting_list_signup_id',

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
    if (typeof inputs.classes[0].user_waiting_list_signup_id !== 'undefined') {
      return exits.success(inputs.classes)
    }

    if (!inputs.user) {
      _.each(inputs.classes, cls => {
        cls.user_waiting_list_signup_id = null
      })
      return exits.success(inputs.classes)
    }

    const userId = sails.helpers.util.idOrObjectIdInteger(inputs.user)

    const classIds = _.map(inputs.classes, 'id')

    const signups = await knex({cwls: 'class_waiting_list_signup'})
      .where('cwls.class', 'in', classIds)
      .andWhere('cwls.user', userId)
      .andWhere('cwls.archived', false)
      .andWhere('cwls.cancelled_at', 0);

    _.each(inputs.classes, cls => {
      const waitingListSignup = _.find(signups, waitingListSignup => waitingListSignup.class == cls.id)
      cls.user_waiting_list_signup_id = waitingListSignup ? waitingListSignup.id : null
    })

    return exits.success(inputs.classes)

  },
}
