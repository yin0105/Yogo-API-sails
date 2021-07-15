module.exports = {
  friendlyName: 'Populate Class.class_signoff_deadline_has_been_exceeded',

  inputs: {
    classes: {
      type: 'ref',
      description: 'An array of classes to populate',
      required: true,
      custom: a => _.isArray(a),
    },
  },

  fn: async function (inputs, exits) {

    if (!inputs.classes.length) {
      return exits.success([]);
    }

    // Already populated??
    if (typeof inputs.classes[0].class_signoff_deadline_has_been_exceeded !== 'undefined') {
      return exits.success(inputs.classes);
    }

    // We need Class.class_has_started
    await sails.helpers.populate.classes.classSignoffDeadlineTimestamp(inputs.classes);

    const nowTimestamp = Date.now();
    _.each(inputs.classes, cls => {
      cls.class_signoff_deadline_has_been_exceeded = nowTimestamp >= cls.class_signoff_deadline_timestamp;
    });

    return exits.success(inputs.classes);

  },
};
