const { exists } = require("fs")

module.exports = {
  friendlyName: 'Get current user',

  inputs: {
    partner: {
      type: 'ref',
      required: true,
    },
  },

  exits: {
    unauthorized: {},
  },

  fn: async (inputs, exits) => {

    const resp = await sails.helpers.integrations.classpass.api.request.with({
      method: 'POST',
      endpoint: '/v1/inventory/partners',
      body: {
        "partner": inputs.partner,
      },
    })

    if (resp.error) {
        return exits.error(resp);
    }

    if (!resp) return
    return exits.success(resp)

  },
}
