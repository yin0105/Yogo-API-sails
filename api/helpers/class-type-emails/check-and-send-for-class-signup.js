module.exports = {
  friendlyName: 'Check and send class type email(s) for signup',

  description: 'Checks if there are any class type emails to send for the provided signup.',

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
        event: 'signup',
      }),
    );

  },
};
