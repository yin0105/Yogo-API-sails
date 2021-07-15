const moment = require('moment-timezone')

module.exports = {
  friendlyName: 'Populate Class.class_livestream_signoff_warning_timestamp',

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
    if (typeof inputs.classes[0].class_livestream_signoff_deadline_timestamp !== 'undefined') {
      return exits.success(inputs.classes)
    }

    const clientId = sails.helpers.util.idOrObjectIdInteger(inputs.classes[0].client_id || inputs.classes[0].client)
    const class_livestream_signoff_deadline = await sails.helpers.clientSettings.find(clientId, 'class_livestream_signoff_deadline')

    _.each(inputs.classes, cls => {

      const classDateFormatted = sails.helpers.util.normalizeDate(cls.date).format('YYYY-MM-DD', 'Europe/Copenhagen')

      const classStart = moment.tz(classDateFormatted + ' ' + cls.start_time, 'Europe/Copenhagen')

      cls.class_livestream_signoff_deadline_timestamp = moment(classStart).subtract(class_livestream_signoff_deadline, 'minutes').format('x')

    })

    return exits.success(inputs.classes)

  },
}
