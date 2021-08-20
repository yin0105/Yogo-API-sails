const moment = require('moment-timezone');

module.exports = {
  friendlyName: 'Capacity text',

  description: 'Populates an array of classes with capacity text, according to the settings specified by the client.',

  inputs: {
    classes: {
      type: 'ref',
      description: 'The classes to populate',
      required: true,
    },
  },

  fn: async function (inputs, exits) {

    if (!inputs.classes.length) {
      return exits.success([]);
    }

    if (typeof inputs.classes[0].capacity_text !== 'undefined') {
      return exits.success(inputs.classes);
    }

    await sails.helpers.populate.classes.signupCount(inputs.classes);

    const classesById = _.keyBy(inputs.classes, 'id');
    let signupCountsByClassId = _.mapValues(classesById, cls => cls.signup_count);

    const clientId = sails.helpers.util.idOrObjectIdInteger(inputs.classes[0].client_id || inputs.classes[0].client);

    const capacitySettings = await sails.helpers.clientSettings.find(
      clientId,
      [
        'calendar_capacity_info_format',
        'calendar_few_seats_left_warning_text',
        'calendar_few_seats_left_warning_limit',
      ],
    );

    _.each(inputs.classes, cls => {

      if (cls.cancelled || cls.archived) {
        cls.capacity_text = '';
        return true; // Continue
      }

      if (!cls.studio_attendance_enabled) {
        cls.capacity_text = '';
        return true; // Continue
      }

      if (cls.seats === 1) { // Private classes
        if (signupCountsByClassId[cls.id] >= 1) {
          cls.capacity_text = sails.helpers.t('capacityText.Booked');
        } else {
          cls.capacity_text = '';
        }
        return true; // Continue
      }

      // Class is open
      if (parseInt(cls.seats) === 0) {
        cls.capacity_text = '';
        return true; // Continue
      }

      const clsStartString = moment(cls.date).format('YYYY-MM-DD') + ' ' + cls.start_time;
      const clsMoment = moment(clsStartString, 'YYYY-MM-DD HH:mm:ss');
      const now = moment().tz('Europe/Copenhagen');
      const hideInfoBecauseClassHasStarted = now.isSameOrAfter(clsMoment);
      if (hideInfoBecauseClassHasStarted) {
        cls.capacity_text = '';
        return true; // Continue
      }

      const seatsAvailable = cls.seats - signupCountsByClassId[cls.id];

      switch (capacitySettings.calendar_capacity_info_format) {
        case 'none':
          if (seatsAvailable <= 0) {
            cls.capacity_text = sails.helpers.t('capacityText.Fully booked');
          } else {
            cls.capacity_text = '';
          }
          break;

        case 'number_of_available_seats':
          if (seatsAvailable <= 0) {
            cls.capacity_text = sails.helpers.t('capacityText.Fully booked');
          } else if (seatsAvailable === 1) {
            cls.capacity_text = sails.helpers.t('capacityText.1 available seat');
          } else {
            cls.capacity_text = sails.helpers.t('capacityText.%s available seats', seatsAvailable);
          }
          break;

        case 'available_slash_total_seats':
          cls.capacity_text = signupCountsByClassId[cls.id] + '/' + cls.seats;
          break;

        case 'warning_on_few_seats_left':
          if (seatsAvailable <= 0) {
            cls.capacity_text = sails.helpers.t('capacityText.Fully booked');
          } else {
            cls.capacity_text = (
              seatsAvailable <= capacitySettings.calendar_few_seats_left_warning_limit &&
              seatsAvailable > 0
            ) ? capacitySettings.calendar_few_seats_left_warning_text : '';
          }
          break;
      }

      if (cls.capacity_text && cls.livestream_enabled) {
        const livestreamOpenString = sails.helpers.t('capacityText.livestreamOpen');
        cls.capacity_text += ` (${livestreamOpenString})`;
      }

    });

    return exits.success(inputs.classes);

  },
};
