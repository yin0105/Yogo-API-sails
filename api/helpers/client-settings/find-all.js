module.exports = {

  friendlyName: 'Find all settings',

  description: 'Returns all settings for the specified client',

  inputs: {
    client: {
      type: 'number',
      description: 'The client (id or object)',
      required: true,
    },
  },

  fn: async (inputs, exits) => {

    const settingsSchema = sails.helpers.clientSettings.getSchema()
    const allSettingsKeys = _.keys(settingsSchema)

    return exits.success(
      await sails.helpers.clientSettings.find.with({
        client: inputs.client,
        keys: allSettingsKeys,
      }),
    )

  },

}
