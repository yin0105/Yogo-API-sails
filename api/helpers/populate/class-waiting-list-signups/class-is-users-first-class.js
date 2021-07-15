module.exports = {
  friendlyName: 'Populate class_is_users_first_class',

  inputs: {
    classWaitingListSignups: {
      type: 'ref',
      required: true,
    },
  },

  fn: async (inputs, exits) => {

    if (!inputs.classWaitingListSignups.length) {
      return exits.success([]);
    }

    if (typeof inputs.classWaitingListSignups[0].class_is_users_first_class !== 'undefined') {
      return exits.success();
    }

    await sails.helpers.populate.classSignups.classIsUsersFirstClass(inputs.classWaitingListSignups);

    return exits.success();

  },
};
