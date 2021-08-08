const { exists } = require("fs")

module.exports = {
  friendlyName: 'Get current user',

  inputs: {
    updates: {
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
      endpoint: '/v1/inventory/batch-updates',
      body: {
        "events": inputs.updates,
      },
    })

    if (resp.error) {
        return exits.error(resp);
    } 
    //   .tolerate('unauthorized', e => {
    //     exits.unauthorized(e.message)
    //     return null
    //   })

    if (!resp) return

    return exits.success(resp)

  },
}
