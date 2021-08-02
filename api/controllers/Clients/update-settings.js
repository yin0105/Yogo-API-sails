module.exports = {

  friendlyName: 'Update client settings',
  inputs: {
    id: {
      type: 'number',
      required: true,
    },
  },

  exits: {
    badRequest: {
      responseType: 'badRequest'
    }
  },

  fn: async function(inputs, exits) {
    const clientId = this.req.client.id ? this.req.client.id: inputs.id;
    const response = await sails.helpers.clientSettings.update(clientId, this.req.body)
      .tolerate('invalidKeys', async (e) => {
        exits.badRequest(e.message)
        return e
      })
      .tolerate('invalidValue', async (e) => {
        exits.badRequest(e.message)
        return e
      })
      .tolerate('invalidEmail', async (e) => {
        exits.badRequest(e.message)
        return e
      })

    if (response instanceof Error) {
      return
    }

    return exits.success()

  }


}
