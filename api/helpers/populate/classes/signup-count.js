const knex = require('../../../objection-models/knex-config')

module.exports = {
  friendlyName: 'Signup count',

  inputs: {
    classes: {
      type: 'ref',
      description: 'The classes to populate with signup count',
      required: true,
    },
  },

  fn: async function (inputs, exits) {

    if (!inputs.classes.length) {
      return exits.success([])
    }

    if (typeof inputs.classes[0].signup_count !== 'undefined') {
      return exits.success(inputs.classes)
    }

    if (inputs.classes[0].signups) {
      _.each(inputs.classes, (cls => cls.signup_count = cls.signups.length))
    } else {

      let signupCounts = await knex({c: 'class'})
        .column(knex.raw(`
        c.id,
        IFNULL(COUNT(cs.id), 0) AS signup_count,
        IFNULL(COUNT(cs.id), 0) AS checkedin_count
        `,
        ))
        .leftJoin({cs: 'class_signup'}, 'c.id', 'cs.class')
        .where('c.id', 'in', _.map(inputs.classes, 'id'))
        .andWhere('c.archived', 0)
        .andWhere('cs.archived', 0)
        .andWhere('cs.cancelled_at', 0)
        .groupBy('c.id')

      let checkedinCounts = await knex({c: 'class'})
        .column(knex.raw(`
        c.id,
        IFNULL(COUNT(cs.id), 0) AS checkedin_count
        `,
        ))
        .leftJoin({cs: 'class_signup'}, 'c.id', 'cs.class')
        .where('c.id', 'in', _.map(inputs.classes, 'id'))
        .andWhere('c.archived', 0)
        .andWhere('cs.archived', 0)
        .andWhere('cs.cancelled_at', 0)
        .andWhere('cs.checked_in', '>', 0)
        .groupBy('c.id')

      signupCounts = _.keyBy(signupCounts, 'id')
      checkedinCounts = _.keyBy(checkedinCounts, 'id')

      _.each(inputs.classes, (cls => {
        cls.signup_count = signupCounts[cls.id] ? signupCounts[cls.id].signup_count : 0;
        cls.checkedin_count = checkedinCounts[cls.id] ? checkedinCounts[cls.id].checkedin_count : 0;
      }))
    }

    return exits.success(inputs.classes)

  },
}
