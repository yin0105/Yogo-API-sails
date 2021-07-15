module.exports = {
  friendlyName: 'Populate class_is_on_users_birthday',

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

    if (typeof inputs.classWaitingListSignups[0].class_is_on_users_birthday !== 'undefined') {
      return exits.success();
    }

    await sails.helpers.populate.classSignups.classIsOnUsersBirthday(inputs.classWaitingListSignups);

    return exits.success();

  },
};
