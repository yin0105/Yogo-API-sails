const { exists } = require("fs")

module.exports = {
  friendlyName: 'Get current user',

  inputs: {
    update: {
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
      endpoint: '/v1/inventory/updates',
      body: inputs.update,
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
