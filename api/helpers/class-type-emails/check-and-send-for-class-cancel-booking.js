module.exports = {
  friendlyName: 'Check and send class type email(s) for class cancelled booking',

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
        modelName: 'ClassSignup',
        event: 'cancel_booking',
      }),
    );

  },
};
