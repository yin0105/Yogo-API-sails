module.exports = {

  friendlyName: 'Generate random code',

  description: 'Generates random code, avoiding letters/numbers that are hard to tell apart.',

  inputs: {
    codeLength: {
      type: 'number',
      description: 'The number of characters in the code.',
      required: true,
    },
  },

  sync: true,

  fn: (inputs, exits) => {
    const characters = "ABCDEFGHJKLMNOPQRSTUVXYZ23456789";

    let code = '';
    for (let i = 0; i < inputs.codeLength; i++) {
      const index = Math.floor(Math.random() * characters.length);
      code += characters.substr(index, 1);
    }
    return exits.success(code);
  },

};
