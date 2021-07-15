module.exports = {
  friendlyName: 'Populate Class.waiting_list_text',

  inputs: {
    classes: {
      type: 'ref',
      description: 'An array of classes to populate',
      required: true,
    },
    i18n: {
      type: 'ref',
      required: true,
    }
  },

  fn: async function (inputs, exits) {

    if (!inputs.classes.length) {
      return exits.success([])
    }

    // Already populated??
    if (typeof inputs.classes[0].waiting_list_text !== 'undefined') {
      return exits.success(inputs.classes)
    }

    // Is waiting list enabled?
    const clientId = sails.helpers.util.idOrObjectIdInteger(inputs.classes[0].client_id || inputs.classes[0].client)

    const classWaitingListEnabled = await sails.helpers.clientSettings.find(clientId, 'class_waiting_list_enabled')
    const privateClassWaitingListEnabled = await sails.helpers.clientSettings.find(clientId, 'private_class_waiting_list_enabled')

    if (!classWaitingListEnabled && !privateClassWaitingListEnabled) {
      _.each(
        inputs.classes,
        cls => cls.waiting_list_text = '',
      )
      return exits.success(inputs.classes)
    }

    /*const classMaxWaitingListSignups = await sails.helpers.clientSettings.find(inputs.classes[0].client, 'class_waiting_list_max_customers_on_waiting_list')
    const privateClassMaxWaitingListSignups = await sails.helpers.clientSettings.find(inputs.classes[0].client, 'private_class_waiting_list_max_customers_on_waiting_list')*/

    await sails.helpers.populate.classes.classAcceptsWaitingListSignups(inputs.classes)
    await sails.helpers.populate.classes.classSignoffDeadlineHasBeenExceeded(inputs.classes)
    await sails.helpers.populate.classes.classIsFullyBooked(inputs.classes)
    await sails.helpers.populate.classes.waitingListCount(inputs.classes)
    await sails.helpers.populate.classes.waitingListIsFull(inputs.classes)

    _.each(inputs.classes, cls => {

      if (!cls.class_is_fully_booked || cls.cancelled) {
        cls.waiting_list_text = ''
        return
      }

      if (parseInt(cls.seats) === 1) {
        if (!privateClassWaitingListEnabled) {
          cls.waiting_list_text = ''
          return
        }
      } else {
        if (!classWaitingListEnabled) {
          cls.waiting_list_text = ''
          return
        }
      }

      // Waiting lists are cleared after class signoff deadline
      if (cls.class_signoff_deadline_has_been_exceeded) {
        cls.waiting_list_text = ''
        return
      }

      if (cls.waiting_list_is_full) {
        cls.waiting_list_text = inputs.i18n.__('waitingList.waitingListIsFull')
      } else {
        cls.waiting_list_text = inputs.i18n.__('waitingList.xPersonsOnWaitingList', cls.waiting_list_count)
      }

    })

    return exits.success(inputs.classes)

  },
}
