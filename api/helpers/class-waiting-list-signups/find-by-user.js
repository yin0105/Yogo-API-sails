const moment = require('moment-timezone'),
  knex = require('../../services/knex')

module.exports = {

  friendlyName: 'Find class waiting list signups by user',

  description: 'Finds all class waiting list signups that a specific user has',

  inputs: {

    user: {
      type: 'ref',
      description: 'The user that you want to find waiting list signups for',
      required: true,
    },

    startDate: {
      type: 'ref',
      description: 'Find waiting list signups for classes starting on this date or later',
      required: false,
    },

    endDate: {
      type: 'ref',
      description: 'Find waiting list signups for classes starting on this date or earlier',
      required: false,
    },

  },

  exits: {
    success: {},

    userNotFound: {
      description: 'The specified user was not found in the database',
    },

    startDateTooEarly: {
      description: 'startDate must be in 2017 or later',
    },

    endDateEarlierThanStartDate: {
      description: 'endDate must be later than or equal to startDate',
    },

    dateRangeTooLong: {
      description: 'Date range can not be more than a year',
    },

  },

  async fn(inputs, exits) {

    const user = await User.findOne(
      sails.helpers.util.idOrObjectIdInteger(inputs.user),
    )
    if (!user || user.archived) {
      throw 'userNotFound'
    }

    const startDate = inputs.startDate ? moment(inputs.startDate, 'YYYY-MM-DD') : moment()
    const endDate = inputs.endDate ? moment(inputs.endDate, 'YYYY-MM-DD') : moment(startDate).add(1, 'year').subtract(1, 'day')

    if (startDate.year() < 2017) {
      throw 'startDateTooEarly'
    }

    if (endDate.isBefore(startDate, 'day')) {
      throw 'endDateEarlierThanStartDate'
    }

    if (endDate.diff(startDate, 'year') >= 1) {
      throw 'dateRangeTooLong'
    }

    const dbResult = await knex({cwls: 'class_waiting_list_signup'})
      .innerJoin({c: 'class'},'c.id', 'cwls.class')
      .where('cwls.archived', false)
      .where('cwls.cancelled_at', 0)
      .andWhere('c.archived', false)
      .andWhere('cwls.user', user.id)
      .andWhere('c.date', '>=', startDate.format('YYYY-MM-DD', 'Europe/Copenhagen'))
      .andWhere('c.date', '<=', endDate.format('YYYY-MM-DD', 'Europe/Copenhagen'))

    return exits.success(dbResult)
  },

}
