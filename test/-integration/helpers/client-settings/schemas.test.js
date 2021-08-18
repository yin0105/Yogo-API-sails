const assert = require('assert')

describe('helpers.client-settings.schemas', async () => {

  it('should not have duplicates in public and secret schemas', async () => {

    const publicSchema = sails.helpers.clientSettings.getSchema()
    const secretSchema = sails.helpers.clientSettings.getSecretsSchema()

    const publicKeys = _.keys(publicSchema)
    const secretKeys = _.keys(secretSchema)

    const duplicateKeys = _.intersection(publicKeys, secretKeys)

    assert.deepStrictEqual(
      duplicateKeys,
      [],
    )

  })

  it('should only contain allowed data types', async () => {

    const publicSchema = sails.helpers.clientSettings.getSchema()
    const secretSchema = sails.helpers.clientSettings.getSecretsSchema()

    const combinedSchemas = Object.assign(publicSchema, secretSchema)

    const keysWithInvalidDataTypes = _.pickBy(
      combinedSchemas,
      item => !_.includes(['boolean', 'string', 'integer'], item.type),
    )

    assert.deepStrictEqual(
      keysWithInvalidDataTypes,
      {}
    )

  })

  it('should specify all locales for keys with "localizedDefault: true"', async () => {

    const publicSchema = sails.helpers.clientSettings.getSchema()
    const secretSchema = sails.helpers.clientSettings.getSecretsSchema()

    const combinedSchemas = Object.assign(publicSchema, secretSchema)

    const keysWithLocalizedDefault = _.pickBy(
      combinedSchemas,
      item => item.localizedDefault
    )

    const keysMissingTranslation = _.pickBy(
      keysWithLocalizedDefault,
      item => !_.isObject(item.defaultsTo) || !item.defaultsTo || !item.defaultsTo.en
    )

    assert.deepStrictEqual(
      keysMissingTranslation,
      {}
    )

  })

})
