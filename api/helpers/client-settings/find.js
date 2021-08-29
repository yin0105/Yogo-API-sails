module.exports = {

  friendlyName: 'Find settings',

  description: 'Returns the requested settings for the specified client',

  inputs: {
    client: {
      type: 'ref',
      description: 'The client (id or object)',
      required: true,
    },
    keys: {
      type: 'ref',
      description: 'An array of keys or a single key (string) to fetch´',
      required: true,
    },
    includeSecrets: {
      type: 'boolean',
      description: 'Whether the request should include secret (server-only) settings',
      defaultsTo: false,
    }
  },

  exits: {
    invalidKey: {
      description: 'One or more keys are invalid',
    },
  },

  fn: async (inputs, exits) => {

    const clientId = sails.helpers.util.idOrObjectIdInteger(inputs.client)

    let settingsSchema = sails.helpers.clientSettings.getSchema()

    if (inputs.includeSecrets) {
      const secretSettingsSchema = sails.helpers.clientSettings.getSecretsSchema()
      Object.assign(settingsSchema, secretSettingsSchema)
    }
    

    const allSettingsKeys = _.keys(settingsSchema)

    const keys = _.isArray(inputs.keys) ?
      inputs.keys :
      [inputs.keys]

    const invalidKeys = _.difference(
      keys,
      allSettingsKeys,
    )

    if (invalidKeys.length) {
      return exits.invalidKey({
        error: true,
        message: 'Query contains the following invalid key(s): ' + invalidKeys.join(', ') + "\n\nValid client settings are:\n" + JSON.stringify(Object.keys(settingsSchema))
      })
    }

    const requestedSettingsKeys = _.intersection(
      keys,
      allSettingsKeys,
    )

    console.log("requestedSettingsKeys = ", requestedSettingsKeys)

    const settingsDbRows = await ClientSettings.find({
      key: requestedSettingsKeys,
      client: clientId,
    })

    const settingsDbObject = {}

    _.each(settingsDbRows, row => {

      switch (settingsSchema[row['key']].type) {
        case 'boolean':
          settingsDbObject[row['key']] = !!parseInt(row['value'])
          break
        case 'string':
          settingsDbObject[row['key']] = row['value']
          break

        case 'integer':
          settingsDbObject[row['key']] = parseInt(row['value'])
          break

      }

    })

    const missingDbKeys = _.difference(requestedSettingsKeys, _.keys(settingsDbObject))

    const neededDefaultSettingsSchema = _.pick(settingsSchema, missingDbKeys)

    const localeSetting = await ClientSettings.findOne({
      key: 'locale',
      client: clientId,
    })

    let locale
    if (localeSetting) {
      locale = localeSetting.value
    } else {
      locale = settingsSchema.locale.defaultsTo
    }

    const neededDefaults = _.mapValues(neededDefaultSettingsSchema, setting => setting.localizedDefault ? setting.defaultsTo[locale] : setting.defaultsTo)


    _.assign(settingsDbObject, neededDefaults)

    if (_.isArray(inputs.keys)) {
      return exits.success(settingsDbObject)
    } else {
      return exits.success(settingsDbObject[_.keys(settingsDbObject)[0]])
    }



  },
}
