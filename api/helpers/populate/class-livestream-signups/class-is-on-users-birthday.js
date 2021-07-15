module.exports = {
  friendlyName: 'Populate class_is_on_users_birthday',

  inputs: {
    classLivestreamSignups: {
      type: 'ref',
      required: true,
    },
  },

  fn: async (inputs, exits) => {

    if (!inputs.classLivestreamSignups.length) {
      return exits.success([]);
    }

    if (typeof inputs.classLivestreamSignups[0].class_is_on_users_birthday !== 'undefined') {
      return exits.success();
    }

    await sails.helpers.populate.classSignups.classIsOnUsersBirthday(inputs.classLivestreamSignups);

    return exits.success();

  },
};
