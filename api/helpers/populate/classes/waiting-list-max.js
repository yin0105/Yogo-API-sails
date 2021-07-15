module.exports = {
  friendlyName: 'Waiting list max length',

  inputs: {
    classes: {
      type: 'ref',
      description: 'The classes to populate',
      required: true,
    },
  },

  fn: async function (inputs, exits) {

    if (!inputs.classes.length) {
      return exits.success([])
    }

    if (typeof inputs.classes[0].waiting_list_max !== 'undefined') {
      return exits.success(inputs.classes)
    }

    const clientId = sails.helpers.util.idOrObjectIdInteger(inputs.classes[0].client_id || inputs.classes[0].client)

    const maxCustomersOnWaitingList = await sails.helpers.clientSettings.find(clientId, 'class_waiting_list_max_customers_on_waiting_list')
    const maxCustomersOnPrivateClassWaitingList = await sails.helpers.clientSettings.find(clientId, 'private_class_waiting_list_max_customers_on_waiting_list')


    _.each(inputs.classes, cls => {

      const seats = parseInt(cls.seats)

      if (seats === 0) {

        cls.waiting_list_max = 0

      } else if (seats === 1) {

        cls.waiting_list_max = maxCustomersOnPrivateClassWaitingList

      } else {

        cls.waiting_list_max = maxCustomersOnWaitingList

      }

    })

    return exits.success(inputs.classes)

  },
}
