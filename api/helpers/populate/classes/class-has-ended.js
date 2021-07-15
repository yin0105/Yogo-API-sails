const moment = require('moment-timezone')

module.exports = {
  friendlyName: 'Populate Class.ended',

  inputs: {
    classes: {
      type: 'ref',
      description: 'An array of classes to populate',
      required: true,
    },
  },

  fn: async function (inputs, exits) {

    if (!inputs.classes.length) {
      return exits.success([])
    }

    // Already populated??
    if (typeof inputs.classes[0].class_has_ended !== 'undefined') {
      return exits.success(inputs.classes)
    }

    const now = moment()

    _.each(inputs.classes, cls => {

      const classDateFormatted = moment(cls.date).format('YYYY-MM-DD', 'Europe/Copenhagen')
      const classEnd = moment.tz(classDateFormatted + ' ' + cls.end_time, 'Europe/Copenhagen')

      cls.class_has_ended = now.isSameOrAfter(classEnd)

    })

    return exits.success(inputs.classes)

  },
}
