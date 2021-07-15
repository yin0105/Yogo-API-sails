const knex = require('../../../objection-models/knex-config')

module.exports = {
  friendlyName: 'Livestream signup count',

  inputs: {
    classes: {
      type: 'ref',
      description: 'The classes to populate',
      required: true,
    },
  },

  fn: async function (inputs, exits) {

    if (!inputs.classes.length) {
      return exits.success([])
    }

    if (typeof inputs.classes[0].livestream_signup_count !== 'undefined') {
      return exits.success(inputs.classes)
    }

    if (inputs.classes[0].livestream_signups) {
      _.each(inputs.classes, (cls => cls.livestream_signup_count = cls.livestream_signups.length))
    } else {

      let livestreamSignupCounts = await knex({c: 'class'})
        .column(knex.raw(`
        c.id,
        IFNULL(COUNT(cls.id), 0) AS livestream_signup_count
        `,
        ))
        .leftJoin({cls: 'class_livestream_signup'}, 'c.id', 'cls.class')
        .where('c.id', 'in', _.map(inputs.classes, 'id'))
        .andWhere('c.archived', 0)
        .andWhere('cls.archived', 0)
        .andWhere('cls.cancelled_at', 0)
        .groupBy('c.id')

      livestreamSignupCounts = _.keyBy(livestreamSignupCounts, 'id')

      _.each(inputs.classes, (cls => {
        cls.livestream_signup_count = livestreamSignupCounts[cls.id] ? livestreamSignupCounts[cls.id].livestream_signup_count : 0
      }))
    }

    return exits.success(inputs.classes)

  },
}
