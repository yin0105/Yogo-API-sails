const moment = require('moment-timezone');

module.exports = {
  friendlyName: 'Populate Class.class_signoff_warning_timestamp',

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
    if (typeof inputs.classes[0].class_signoff_deadline_timestamp !== 'undefined') {
      return exits.success(inputs.classes);
    }

    const clientIds = _.chain(inputs.classes)
      .map(
        classObj => sails.helpers.util.idOrObjectIdInteger(classObj.client_id || classObj.client),
      )
      .uniq()
      .value();

    const deadlines = {};
    for (let i = 0; i < clientIds.length; i++) {
      const clientId = clientIds[i];
      const noShowFeesEnabled = await sails.helpers.clientSettings.find(clientId, 'no_show_fees_enabled');
      if (noShowFeesEnabled) {
        deadlines[clientId] = await sails.helpers.clientSettings.find(clientId, ['private_class_signoff_deadline', 'class_signoff_deadline']);
      } else {
        deadlines[clientId] = {private_class_signoff_deadline: 0, class_signoff_deadline: 0};
      }
    }

    _.each(inputs.classes, cls => {

      const classClientId = sails.helpers.util.idOrObjectIdInteger(cls.client_id || cls.client);

      let classDateFormatted = sails.helpers.util.normalizeDate(cls.date).format('YYYY-MM-DD');

      const classStart = moment.tz(classDateFormatted + ' ' + cls.start_time, 'Europe/Copenhagen');

      if (parseInt(cls.seats) === 1) {
        const privateClassDeadline = deadlines[classClientId].private_class_signoff_deadline;
        cls.class_signoff_deadline_timestamp = moment(classStart).subtract(privateClassDeadline, 'minutes').format('x');
      } else {
        const classDeadline = deadlines[classClientId].class_signoff_deadline;
        cls.class_signoff_deadline_timestamp = moment(classStart).subtract(classDeadline, 'minutes').format('x');
      }

    });

    return exits.success(inputs.classes);

  },
};
