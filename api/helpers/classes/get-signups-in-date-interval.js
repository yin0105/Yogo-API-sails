module.exports = {
  friendlyName: 'Get signups in date interval',

  description: 'Get all types of signups between two dates (both dates inclusive)',

  inputs: {
    user: {
      type: 'ref',
      required: true
    },
    startDate: {
      type: 'ref',
      required: true
    },
    endDate: {
      type: 'ref',
      required: true
    }
  },

  fn: async (inputs, exits) => {

    const userId = sails.helpers.util.idOrObjectIdInteger(inputs.user);

    const startDate = sails.helpers.util.normalizeDate(inputs.startDate);
    const endDate = sails.helpers.util.normalizeDate(inputs.endDate);


    const userSignedUpForAttendanceClassesInRequestedPeriod = await knex({cs: 'class_signup'})
      .column([
        'c.id',
        'c.date',
        'cs.used_membership',
      ])
      .innerJoin({c: 'class'}, 'cs.class', 'c.id')
      .where('cs.user', userId)
      .andWhere('cs.archived', false)
      .andWhere('cs.cancelled_at', 0)
      .andWhere('c.archived', false)
      .andWhere('c.cancelled', false)
      .andWhere('c.date', '>=', startDate.format('YYYY-MM-DD'))
      .andWhere('c.date', '<=', endDate.format('YYYY-MM-DD'));

    const userSignedUpForLivestreamsInRequestedPeriod = await knex({cls: 'class_livestream_signup'})
      .column([
        'c.id',
        'c.date',
        'cls.used_membership',
      ])
      .innerJoin({c: 'class'}, 'cls.class', 'c.id')
      .where('cls.user', userId)
      .andWhere('cls.archived', false)
      .andWhere('cls.cancelled_at', 0)
      .andWhere('c.archived', false)
      .andWhere('c.cancelled', false)
      .andWhere('c.date', '>=', startDate.format('YYYY-MM-DD'))
      .andWhere('c.date', '<=', endDate.format('YYYY-MM-DD'));

    const userSignedUpForWaitingListsInRequestedPeriod = await knex({cwls: 'class_waiting_list_signup'})
      .column([
        'c.id',
        'c.date',
        'cwls.used_membership',
      ])
      .innerJoin({c: 'class'}, 'cwls.class', 'c.id')
      .where('cwls.user', userId)
      .andWhere('cwls.archived', false)
      .andWhere('cwls.cancelled_at', 0)
      .andWhere('c.archived', false)
      .andWhere('c.cancelled', false)
      .andWhere('c.date', '>=', startDate.format('YYYY-MM-DD'))
      .andWhere('c.date', '<=', endDate.format('YYYY-MM-DD'));

    const userSignedUpForClassesInRequestedPeriod = _.concat(
      userSignedUpForAttendanceClassesInRequestedPeriod,
      userSignedUpForLivestreamsInRequestedPeriod,
      userSignedUpForWaitingListsInRequestedPeriod,
    );

    return exits.success(userSignedUpForClassesInRequestedPeriod);

  }
}
