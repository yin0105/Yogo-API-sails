module.exports = {

  friendlyName: 'Can',

  description: 'Checks if  user is allowed to perform the specified action',

  inputs: {

    user: {
      type: 'ref',
      description: 'The user in question. Can be ID or object',
      required: false,
    },

    action: {
      type: 'string',
      description: 'The action to perform.',
      required: true,
    },

    modelName: {
      type: 'string',
      description: 'Model name',
      required: false,
    },

    recordData: {
      type: 'ref',
      description: 'ID or data of the record in question',
      required: false,
    },

  },

  fn: async (inputs, exits) => {

    const policyHelper = sails.helpers.acl.models[_.camelCase(inputs.modelName) + 'Policy']()

    if (typeof policyHelper[inputs.action] !== 'function') {
      throw new Error(`Can't find policy action \`${inputs.action}\` for \`${inputs.modelName}\``)
    }

    const user = inputs.user ?
      (
        _.isObject(inputs.user) ?
          inputs.user :
          await User.findOne(user)
      )
      : null

    return exits.success(
      await policyHelper[inputs.action](user, inputs.recordData),
    )

  },

}
