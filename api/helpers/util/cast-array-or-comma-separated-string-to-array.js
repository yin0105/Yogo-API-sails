module.exports = {

  friendlyName: 'Cast array or comma separated list to array',

  description: 'Converts a comma separated string to array. If input is an array, returns opriginal array. If input is null, returns an empty array.',

  sync: true,

  inputs: {
    input: {
      type: 'ref',
      description: 'The input. Can be either an array, a comma separated string, or null.',
      required: false,
    },

  },

  fn: (inputs, exits) => {
    if (!inputs.input) return exits.success([])

    if (_.isArray(inputs.input))  return exits.success(inputs.input)

    if (_.isString(inputs.input)) return exits.success(inputs.input.split(','))

    throw new Error('Input must be an array or a string or null')
  },

}
