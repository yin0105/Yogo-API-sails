module.exports = {
  friendlyName: 'Throw error with code',

  inputs: {
    code: {
      type: 'string',
      required: true
    },
  },

  sync: true,

  fn: (inputs, exits) => {

    const e = new Error();
    e.code = inputs.code;
    throw e;

  }
}
