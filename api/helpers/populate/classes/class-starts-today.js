const moment = require('moment-timezone');

module.exports = {
  friendlyName: 'Populate Class.class_starts_today',

  inputs: {
    classes: {
      type: 'ref',
      description: 'An array of classes to populate',
      required: true,
    },
  },

  fn: async function (inputs, exits) {

    if (!inputs.classes.length) {
      return exits.success([]);
    }

    // Already populated??
    if (typeof inputs.classes[0].class_starts_today !== 'undefined') {
      return exits.success(inputs.classes);
    }

    const now = moment.tz('Europe/Copenhagen');

    _.each(inputs.classes, cls => {

      const classDate = moment.tz(cls.date, 'Europe/Copenhagen');

      cls.class_starts_today = classDate.isSame(now, 'day');

    });

    return exits.success(inputs.classes);

  },
};
