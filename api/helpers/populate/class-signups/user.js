module.exports = {
  friendlyName: 'Populate user',

  inputs: {
    classSignups: {
      type: 'ref',
      required: true,
    },
  },

  fn: async (inputs, exits) => {

    if (!inputs.classSignups.length) {
      return exits.success([]);
    }

    if (_.isObject(inputs.classSignups[0].user)) {
      return exits.success();
    }

    const userIds = _.chain(inputs.classSignups)
      .map(cs => cs.user_id || cs.user)
      .uniq()
      .value();

    const users = await User.find({id: userIds});

    const usersJson = _.map(users, u => u.toJSON());

    _.each(inputs.classSignups, cs => cs.user = _.find(usersJson, {id: cs.user_id || cs.user}));

    return exits.success();

  },
};
