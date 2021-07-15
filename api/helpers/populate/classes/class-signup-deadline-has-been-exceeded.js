const moment = require('moment-timezone')

module.exports = {
  friendlyName: 'Populate Class.class_signup_deadline_has_been_exceeded',

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
    if (typeof inputs.classes[0].class_signup_deadline_has_been_exceeded !== 'undefined') {
      return exits.success(inputs.classes)
    }

    // We need Class.class_has_started
    await sails.helpers.populate.classes.classHasStarted(inputs.classes)

    const now = moment()
    const clientId = sails.helpers.util.idOrObjectIdInteger(inputs.classes[0].client_id || inputs.classes[0].client)
    const {private_class_signup_deadline} = await sails.helpers.clientSettings.find(clientId, ['private_class_signup_deadline'])

    _.each(inputs.classes, cls => {

      const classDateFormatted = sails.helpers.util.normalizeDate(cls.date).format('YYYY-MM-DD', 'Europe/Copenhagen')
      const classStart = moment.tz(classDateFormatted + ' ' + cls.start_time, 'Europe/Copenhagen')

      if (parseInt(cls.seats) === 1) {
        const privateClassSignupDeadline = moment(classStart).subtract(private_class_signup_deadline, 'minutes')
        cls.class_signup_deadline_has_been_exceeded = now.isSameOrAfter(privateClassSignupDeadline)
      } else {
        cls.class_signup_deadline_has_been_exceeded = cls.class_has_started
      }

    })

    return exits.success(inputs.classes)

  },
}
