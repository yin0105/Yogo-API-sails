module.exports = {
  friendlyName: 'Dummy helper',

  description: 'Can be used for instance for testing',

  fn: async (inputs, exits) => {
    return exits.success()
  }
}
