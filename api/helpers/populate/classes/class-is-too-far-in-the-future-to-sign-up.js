const moment = require('moment-timezone')

module.exports = {
  friendlyName: 'Populate Class.class_is_too_far_in_the_future_to_sign_up',

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
    if (typeof inputs.classes[0].class_is_too_far_in_the_future_to_sign_up !== 'undefined') {
      return exits.success(inputs.classes)
    }

    const clientId = sails.helpers.util.idOrObjectIdInteger(inputs.classes[0].client_id || inputs.classes[0].client)

    const {customer_can_sign_up_for_class_max_days_before_class} = await sails.helpers.clientSettings.find(clientId, ['customer_can_sign_up_for_class_max_days_before_class'])

    const now = moment.tz('Europe/Copenhagen')

    _.each(inputs.classes, cls => {

      const firstDayCustomerCanSignUpForClass = moment(cls.date).tz('Europe/Copenhagen').subtract(customer_can_sign_up_for_class_max_days_before_class, 'day')

      cls.class_is_too_far_in_the_future_to_sign_up = now.isBefore(firstDayCustomerCanSignUpForClass, 'day')

    })

    return exits.success(inputs.classes)

  },
}
