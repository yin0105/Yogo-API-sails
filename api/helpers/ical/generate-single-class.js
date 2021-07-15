const ics = require('ics');
const ObjectionClass = require('../../objection-models/Class');
const moment = require('moment-timezone');

module.exports = {
  friendlyName: 'Generate single class.',

  description: 'Get iCal data for a single class',

  inputs: {
    'class': {
      type: 'ref',
      required: true,
    },
  },

  fn: async (inputs, exits) => {

    const classId = sails.helpers.util.idOrObjectIdInteger(inputs.class);

    const classItem = await ObjectionClass
      .query()
      .findById(classId)
      .eager({
        class_type: true,
        teachers: true,
        room: {
          branch: true,
        },
      });


    const classDateFormatted = moment(classItem.date).format('YYYY-MM-DD');

    const classStart = moment.tz(classDateFormatted + ' ' + classItem.start_time, 'YYYY-MM-DD HH:mm:ss', 'Europe/Copenhagen').tz('UTC');

    const classEnd = moment.tz(classDateFormatted + ' ' + classItem.end_time, 'YYYY-MM-DD HH:mm:ss', 'Europe/Copenhagen').tz('UTC');

    let description = classItem.teachers.length
      ? (sails.helpers.t('global.with') + ' ' + _.map(classItem.teachers, 'first_name').join(', ') + '.')
      : '';


    let location =
      classItem.room
        ? (classItem.room.name + (classItem.room.branch ? ', ' + classItem.room.branch.name : '') + '.')
        : '';

    const icsEvent = {
      start: classStart.format('Y-M-D-H-m').split('-'),
      end: classEnd.format('Y-M-D-H-m').split('-'),
      startInputType: 'utc',
      endInputType: 'utc',
      title: classItem.class_type.name,
      description,
      location,
    };

    let {error, value} = ics.createEvent(icsEvent);

    if (error) {
      throw error;
    }

    value = value.replace(/adamgibbons\/ics/, 'Yogo API');
    value = value.replace(/X-PUBLISHED-TTL:PT1H/, 'X-PUBLISHED-TTL:PT5M');

    return exits.success(value);
  },
};
