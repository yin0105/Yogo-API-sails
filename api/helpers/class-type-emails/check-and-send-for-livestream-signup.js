module.exports = {
  friendlyName: 'Check and send class type email(s) for class cancel booking',

  inputs: {
    signup: {
      type: 'ref',
      required: true,
    },
  },

  fn: async (inputs, exits) => {

    return exits.success(
      await sails.helpers.classTypeEmails.checkAndSend.with({
        signup: inputs.signup,
        modelName: 'ClassLivestreamSignup',
        event: 'signup',
      }),
    );

  },
};
