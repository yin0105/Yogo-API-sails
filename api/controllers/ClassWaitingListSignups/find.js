const moment = require('moment-timezone')

module.exports = {

  friendlyName: 'Find Class waiting list signups',

  inputs: {
    user: {
      type: 'number',
      required: false,
    },
    'class': {
      type: 'number',
      required: false,
    },
    startDate: {
      type: 'string',
      regex: /^\d\d\d\d-\d\d-\d\d$/,
      required: false,
    },
    endDate: {
      type: 'string',
      regex: /^\d\d\d\d-\d\d-\d\d$/,
      required: false,
    },
    populate: {
      type: 'json',
      required: false,
    },
  },

  exits: {
    forbidden: {
      responseType: 'forbidden',
    },
    badRequest: {
      responseType: 'badRequest',
    },
    startDateTooEarly: {
      responseType: 'badRequest',
    },
    endDateEarlierThanStartDate: {
      responseType: 'badRequest',
    },
    dateRangeTooLong: {
      responseType: 'badRequest',
    },
  },


  fn: async function (inputs, exits) {


    const can = await sails.helpers.can2('controller.ClassWaitingListSignups.find', this.req)
      .tolerate('badRequest', async e => {
        exits.badRequest(e.message)
        return null
      })

    if (can === null) return
    if (can === false) return exits.forbidden()


    const query = knex({cwls: 'class_waiting_list_signup'})
      .where({
        'cwls.archived': false,
        'cwls.cancelled_at': 0,
      })

    if (inputs.user) {

      const startDate = inputs.startDate ? moment.tz(inputs.startDate, 'YYYY-MM-DD', 'Europe/Copenhagen') : moment()
      const endDate = inputs.endDate ? moment.tz(inputs.endDate, 'YYYY-MM-DD', 'Europe/Copenhagen') : moment(startDate).add(1, 'year').subtract(1, 'day')

      if (startDate.year() < 2017) {
        return exits.startDateTooEarly('Start date ' + startDate.format('YYYY-MM-DD') + ' too early')
      }

      if (endDate.isBefore(startDate, 'day')) {
        return exits.endDateEarlierThanStartDate('End date ' + endDate.format('YYYY-MM-DD') + ' earlier than startDate ' + startDate.format('YYYY-MM-DD'))
      }

      if (endDate.diff(startDate, 'year') >= 1) {
        return exits.dateRangeTooLong('Date range ' + startDate.format('YYYY-MM-DD') + ' to ' + endDate.format('YYYY-MM-DD') + ' too long. Maximum is one year.')
      }

      query
        .innerJoin({c: 'class'}, 'c.id', 'cwls.class')
        .andWhere('c.archived', false)
        .andWhere('cwls.user', inputs.user)
        .andWhere('c.date', '>=', startDate.format('YYYY-MM-DD', 'Europe/Copenhagen'))
        .andWhere('c.date', '<=', endDate.format('YYYY-MM-DD', 'Europe/Copenhagen'))

    } else if (inputs.class) {

      query
        .andWhere('cwls.class', inputs.class)

    } else {
      return exits.badRequest('User or class must be specified')
    }

    const populateFields = _.intersection(
      inputs.populate,
      [
        'class',
        'class.teachers',
        'class.teachers.image',
        'class.location',
        'class.room',
        'class.room.branch',
        'class.class_type',
        'class.class_type.image',
        'user',
        'user.image',
        'used_class_pass',
        'used_class_pass.class_pass_type',
        'used_membership',
      ],
    )

    const eagerConfigObject = sails.helpers.populate.relationFieldListToEagerLoadConfigObject(populateFields)

    query.eager(eagerConfigObject)
    if (
      this.req.authorizedRequestContext === 'admin' ||
      (
        inputs.user &&
        parseInt(inputs.user) === parseInt(this.req.user.id)
      )
    ) {
      query.modifyEager('user', 'adminSelects')
    } else {
      query.modifyEager('user', 'publicSelects')
    }

    const waitingListSignups = await query

    return exits.success(waitingListSignups)

  },

}
