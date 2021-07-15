module.exports = {
  friendlyName: 'Populate class_is_users_first_class',

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

    if (typeof inputs.classLivestreamSignups[0].class_is_users_first_class !== 'undefined') {
      return exits.success();
    }

    await sails.helpers.populate.classSignups.classIsUsersFirstClass(inputs.classLivestreamSignups);

    return exits.success();

  },
};
