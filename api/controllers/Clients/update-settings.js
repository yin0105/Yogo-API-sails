module.exports = {

  friendlyName: 'Update client settings',

  exits: {
    badRequest: {
      responseType: 'badRequest'
    }
  },

  fn: async function(inputs, exits) {

    const response = await sails.helpers.clientSettings.update(this.req.client.id, this.req.body)
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
