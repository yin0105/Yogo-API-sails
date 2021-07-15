module.exports = {
  friendlyName: 'Get client setting default',

  inputs: {
    key: {
      type: 'string',
      required: true
    },

    locale: {
      type: 'string',
      required: false
    }
  },

  exits: {
    localeMissingForLocalizedDefault: {}
  },

  sync: true,

  fn: (inputs, exits) => {

    const settingsSchema = sails.helpers.clientSettings.getSchema()

    const settingDefinition = settingsSchema[inputs.key]

    if (settingDefinition.localizedDefault) {

      if (!inputs.locale) {
        throw 'localeMissingForLocalizedDefault'
      }

      return exits.success(settingDefinition.defultsTo[inputs.locale])
    }

    return exits.success(settingDefinition.defaultsTo)
  }
}
