const isEmail = require('validator/lib/isEmail')
const isURL = require('validator/lib/isURL')

module.exports = {
  friendlyName: 'Update client settings',

  inputs: {
    client: {
      type: 'ref',
      required: true,
    },
    updateSettings: {
      type: 'json',
      required: true,
    },
  },

  exits: {
    invalidKeys: {},
    invalidValue: {},
    invalidEmail: {},
    invalidURL: {}
  },

  fn: async (inputs, exits) => {

    const clientId = sails.helpers.util.idOrObjectIdInteger(inputs.client)

    const settingsSchema = sails.helpers.clientSettings.getSchema()
    const secretSettingsSchema = sails.helpers.clientSettings.getSecretsSchema()

    const allSettingsSchema = _.assign({}, settingsSchema, secretSettingsSchema)

    const allSettingsKeys = _.keys(allSettingsSchema)

    const requestKeys = _.keys(inputs.updateSettings)

    const invalidKeys = _.difference(
      requestKeys,
      allSettingsKeys,
    )

    if (invalidKeys.length) {
      const e = new Error(
        'The following key(s) are not valid: ' + invalidKeys.join(', ') + '\n\n' +
        'The following client settings (plus some secret settings) are valid:\n' +
        JSON.stringify(settingsSchema)
      )
      e.code = 'invalidKeys'
      throw e
    }

    let validates = true
    _.each(requestKeys, requestKey => {
      if (allSettingsSchema[requestKey].isIn && !_.includes(allSettingsSchema[requestKey].isIn, inputs.updateSettings[requestKey])) {
        const e = new Error('The specified value "' + inputs.updateSettings[requestKey] + '" is not valid for the setting "' + requestKey + '". The following values are valid: ' + settingsSchema[requestKey].isIn.join(', ') + '.')
        e.code = 'invalidValue'
        throw e
      }
      if (allSettingsSchema[requestKey].isEmail && inputs.updateSettings[requestKey] && !isEmail(inputs.updateSettings[requestKey])) {
        const e = new Error('The specified value "' + inputs.updateSettings[requestKey] + '" does not look like a valid email.')
        e.code = 'invalidEmail'
        throw e
      }
      if (allSettingsSchema[requestKey].isURL && inputs.updateSettings[requestKey] && !isURL(inputs.updateSettings[requestKey])) {
        const e = new Error('The specified value "' + inputs.updateSettings[requestKey] + '" does not look like a valid URL.')
        e.code = 'invalidURL'
        throw e
      }
    })

    if (!validates) return

    await Promise.all(
      _.map(
        _.keys(inputs.updateSettings),

        async key => {

          let value
          switch (allSettingsSchema[key].type) {
            case 'string':
              value = inputs.updateSettings[key]
              break
            case 'integer':
              value = parseInt(inputs.updateSettings[key])
              break
            case 'boolean':
              value = inputs.updateSettings[key] ? 1 : 0
              break
          }


          const updatedRecord = await ClientSettings.update({
            client: clientId,
            key: key,
          }, {
            value: value,
          }).fetch()

          if (!updatedRecord.length) {
            await ClientSettings.create({
              client: clientId,
              key: key,
              value: value,
            })
          }
        },
      ),
    )

    return exits.success()

  },
}
