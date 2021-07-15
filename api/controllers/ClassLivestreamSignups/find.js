const ObjectionClassLivestreamSignup = require('../../objection-models/ClassLivestreamSignup')
const moment = require('moment-timezone')

const VALID_EAGER_POPULATE_FIELDS = [
  'class',
  'class.teachers',
  'class.teachers.image',
  'class.room',
  'class.room.branch',
  'class.class_type',
  'class.class_type.image',
  'user',
  'user.image',
  'used_class_pass',
  'used_class_pass.class_pass_type',
  'used_membership',
]

module.exports = {

  inputs: {
    user: {
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
    'class': {
      type: 'number',
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

    const can = await sails.helpers.can2('controller.ClassLivestreamSignups.find', this.req)
      .tolerate('badRequest', async e => {
        res.badRequest(e.message)
        return null
      })

    if (can === null) return
    if (can === false) return exits.forbidden()

    let query = ObjectionClassLivestreamSignup.query()
      .alias('cls')
      .where({
        'cls.archived': 0,
        'cls.cancelled_at' : 0,
        'cls.client': this.req.client.id,
      })

    if (inputs.user) {

      const startDate = inputs.startDate ? moment(inputs.startDate, 'YYYY-MM-DD') : moment.tz('Europe/Copenhagen')
      const endDate = inputs.endDate ? moment(inputs.endDate, 'YYYY-MM-DD') : moment(startDate).add(1, 'year').subtract(1, 'day')

      if (startDate.year() < 2017) {
        return exits.startDateTooEarly('Start date too early')
      }

      if (endDate.isBefore(startDate, 'day')) {
        return exits.endDateEarlierThanStartDate('End date earlier than start date')
      }

      if (endDate.diff(startDate, 'year') >= 1) {
        return exits.dateRangeTooLong('Date range too long')
      }

      query
        .innerJoin({u: 'user'}, 'cls.user', 'u.id')
        .andWhere({
            'u.id': inputs.user,
            'u.archived': 0,
          },
        )
        .innerJoin({c: 'class'}, 'c.id', 'cls.class')
        .andWhere('c.date', '>=', startDate.format('YYYY-MM-DD'))
        .andWhere('c.date', '<=', endDate.format('YYYY-MM-DD'))

    } else if (inputs.class) {

      query
        .innerJoin({c: 'class'}, 'c.id', 'cls.class')
        .andWhere({
            'c.id': inputs.class,
            'c.archived': 0,
          },
        )

    } else {
      return res.badRequest('User or class must be specified')
    }

    const eagerPopulateFields = _.intersection(inputs.populate, VALID_EAGER_POPULATE_FIELDS)

    const eagerPopulateObject = sails.helpers.populate.relationFieldListToEagerLoadConfigObject(eagerPopulateFields)
    query
      .eager(eagerPopulateObject)
      .modifyEager('class.teachers', 'publicSelects')

    const signups = await query

    //await sails.helpers.classSignups.populate(signups, req.query.populate)

    return exits.success(signups)

  },
}
