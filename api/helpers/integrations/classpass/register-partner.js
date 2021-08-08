const { exists } = require("fs")

module.exports = {
  friendlyName: 'Get current user',

  inputs: {
    partner: {
      type: 'ref',
      required: true,
    },
    accessToken: {
      type: 'string',
      required: false,
    },
  },

  exits: {
    unauthorized: {},
  },

  fn: async (inputs, exits) => {

    const partnerId = sails.helpers.util.idOrObjectIdInteger(inputs.partner)
    const accessToken = inputs.accessToken || (await sails.config.integrations.classpass_com.classpass_com_access_token)

    const resp = await sails.helpers.integrations.classpass.api.request.with({
      method: 'POST',
      endpoint: '/v1/inventory/partners',
      accessToken: accessToken,
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
