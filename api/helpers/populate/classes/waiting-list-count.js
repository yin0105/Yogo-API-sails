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

    if (typeof inputs.classes[0].waiting_list_count !== 'undefined') {
      return exits.success(inputs.classes)
    }

    if (inputs.classes[0].waiting_list_signups) {
      _.each(inputs.classes, (cls => cls.waiting_list_count = cls.waiting_list_signups.length))
    } else {

      let waitingListCounts = await knex({c: 'class'})
        .column(knex.raw(`
        c.id,
        IFNULL(COUNT(cwls.id), 0) AS waiting_list_count
        `,
        ))
        .leftJoin({cwls: 'class_waiting_list_signup'}, 'c.id', 'cwls.class')
        .where('c.id', 'in', _.map(inputs.classes, 'id'))
        .andWhere('c.archived', 0)
        .andWhere('cwls.archived', 0)
        .andWhere('cwls.cancelled_at', 0)
        .groupBy('c.id')

      waitingListCounts = _.keyBy(waitingListCounts, 'id')

      _.each(inputs.classes, (cls => {
        cls.waiting_list_count = waitingListCounts[cls.id] ? waitingListCounts[cls.id].waiting_list_count : 0
      }))
    }

    return exits.success(inputs.classes)

  },
}
