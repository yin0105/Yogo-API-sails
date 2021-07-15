const moment = require('moment-timezone')

module.exports = {
  friendlyName: 'Apply class pass type to customer',

  inputs: {
    classPassType: {
      type: 'ref',
      required: true
    },
    user: {
      type: 'ref',
      required: true
    },
    order: {
      type: 'ref',
      required: false
    }
  },

  fn: async (inputs, exits) => {

    const classPassTypeId = sails.helpers.util.idOrObjectIdInteger(inputs.classPassType);
    let classPassType = await ClassPassType.findOne(classPassTypeId);

    const userId = sails.helpers.util.idOrObjectIdInteger(inputs.user);
    const orderId = inputs.order ? sails.helpers.util.idOrObjectIdInteger(inputs.order) : undefined;

    let today = moment.tz('Europe/Copenhagen').startOf('day')
    let classPassData = {
      client: classPassType.client,
      user: userId,
      order: orderId,
      class_pass_type: classPassType.id,
      classes_left: classPassType.number_of_classes,
      start_date: today.format('YYYY-MM-DD'),
      valid_until: today.add(classPassType.days, 'days').format('YYYY-MM-DD'),
    }

    let classPass = await ClassPass.create(classPassData).fetch()

    if (classPassType.send_email_to_customer) {
      await sails.helpers.email.customer.yourNewClassPass(classPass)
    }

    return exits.success(classPass)

  }
}
