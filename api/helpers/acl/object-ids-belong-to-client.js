module.exports = {

  friendlyName: 'Object ids belong to client',

  description: 'Checks if all provided object IDs on the specified model belong to the specified client',

  inputs: {

    objectIds: {
      type: 'ref',
      description: 'An array of object IDs to be checked',
      required: true,
    },

    model: {
      type: 'ref',
      description: 'A Waterline model, or the name of one',
      required: true,
    },

    client: {
      type: 'ref',
      description: 'A client object or ID',
      required: true,
    },

  },

  exits: {

    invalidObjectIds: {
      description: 'objectIds should be an array of positive integers, and have at least one entry',
    },

    invalidModel: {
      description: 'model should be a Waterline model object or the name of one',
    },

  },

  fn: async (inputs, exits) => {

    if (
      !_.isArray(inputs.objectIds) ||
      !inputs.objectIds.length ||
      !_.every(
        inputs.objectIds,
        objectId => objectId == parseInt(objectId),
      )
    ) {
      throw 'invalidObjectIds'
    }

    const inputIds = _.map(
      inputs.objectIds,
      objectId => parseInt(objectId),
    )

    if (
      !(
        _.isObject(inputs.model) ||
        (
          _.isString(inputs.model) &&
          inputs.model.match(/^[A-Za-z]+$/)
        )
      )
    ) {
      throw 'invalidModel'
    }


    const model = _.isObject(inputs.model) ? inputs.model : eval(inputs.model)

    const dbRecords = await model.find({id: inputIds})

    const client = sails.helpers.util.idOrObjectIdInteger(inputs.client)

    const allObjectIdsBelongToClient = _.every(
      dbRecords,
      dbRecord => dbRecord.client == client,
    )

    return exits.success(
      allObjectIdsBelongToClient,
    )

  },

}
