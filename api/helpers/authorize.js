const NotAuthorizedError = require('../errors/NotAuthorizedError')

module.exports = {

  friendlyName: 'Authorize',

  description: 'Checks if user is allowed to perform the specified action. Throws a NotAuthorizedError if not.',

  inputs: {

    user: {
      type: 'ref',
      description: 'The user to authorize. Can be ID, object or null',
      required: false,
    },

    action: {
      type: 'string',
      description: 'The action to perform.',
      required: true,
    },

    modelName: {
      type: 'string',
      description: 'Name of the model to perform the action on.',
      required: false,
    },

    recordData: {
      type: 'ref',
      description: 'Optional recordId/recordData',
      required: false,
    },

  },

  fn: async (inputs, exits) => {

    if (!await sails.helpers.can.with({
      user: inputs.user,
      action: inputs.action,
      modelName: inputs.modelName,
      recordData: inputs.recordData,
    })) {
      throw new NotAuthorizedError()
    }

    return exits.success()

  },

}
