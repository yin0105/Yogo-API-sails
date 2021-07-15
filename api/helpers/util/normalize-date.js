const moment = require('moment-timezone')

module.exports = {
  friendlyName: 'Normalize date',

  description: "Casts various date formats to moment.js object with the client's timezone",

  inputs: {
    date: {
      type: 'ref',
    },
  },

  sync: true,

  fn: (inputs, exits) => {

    let normalizedDate

    if (_.isString(inputs.date) && inputs.date.match(/^\d\d\d\d-\d\d-\d\d$/)) {
      normalizedDate = moment.tz(inputs.date, 'Europe/Copenhagen')
    } else if (moment.isMoment(inputs.date) || moment.isDate(inputs.date)) {
      normalizedDate = moment(inputs.date).tz('Europe/Copenhagen')
    } else if (
      typeof inputs.date === 'number' ||
      (
        typeof inputs.date === 'string' &&
        inputs.date.match(/^\d+$/)
      )
    ) {
      normalizedDate = moment.tz(parseInt(inputs.date), 'x', 'Europe/Copenhagen')
    }

    return exits.success(normalizedDate)
  },
}
