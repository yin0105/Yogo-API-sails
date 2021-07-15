module.exports = {

  friendlyName: 'Object from object or id',

  description: 'Returns an object, either the input object directly or retrieved from db if input is an id.',

  inputs: {
    input: {
      type: 'ref',
      description: 'Can be an object or an object id.',
      required: true,
    },
    model: {
      type: 'ref',
      description: 'The DB model. (Not the model name.)',
      required: true,
    },
  },

  fn: async (inputs, exits) => {
    if (_.isObject(inputs.input)) {
      return exits.success(inputs.input);
    }

    const dbObject = await inputs.model.findOne(inputs.input);
    const jsonObject = dbObject.toJSON ? dbObject.toJSON() : dbObject;
    return exits.success(jsonObject);
  },

};
