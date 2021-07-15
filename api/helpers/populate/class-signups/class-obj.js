module.exports = {
  friendlyName: 'Populate class',

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

    if (_.isObject(inputs.classSignups[0].class)) {
      return exits.success();
    }

    const classIds = _.chain(inputs.classSignups)
      .map(cs => cs.class_id || cs.class)
      .uniq()
      .value();

    const classes = await Class.find({id: classIds});

    const classesJson = _.map(classes, c => c.toJSON());

    _.each(inputs.classSignups, cs => cs.class = _.find(classesJson, {id: cs.class_id || cs.class}));

    return exits.success();

  },
};
