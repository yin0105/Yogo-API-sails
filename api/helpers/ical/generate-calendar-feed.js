const ics = require('ics');
const ObjectionClass = require('../../objection-models/Class');
const ObjectionEventTimeSlot = require('../../objection-models/EventTimeSlot');
const moment = require('moment-timezone');

module.exports = {
  friendlyName: 'Generate calendar feed.',

  description: 'Get iCal data for a calendar feed of classes and/or event time slots',

  inputs: {
    classes: {
      type: 'ref',
      required: false,
      custom: c => _.isArray(c),
      description: 'An array of classes or class ids',
    },
    eventTimeSlots: {
      type: 'ref',
      required: false,
      custom: c => _.isArray(c),
      description: 'An array of event time slots or event time slot ids',
    },
    calendarName: {
      type: 'string',
      required: true,
    },
  },

  exits: {
    classesOrEventTimeSlotsMustBeSpecified: {},
    icsError: {},
  },

  fn: async (inputs, exits) => {
    console.log("1")

    if (!inputs.classes && !inputs.eventTimeSlots) {
      throw 'classesOrEventTimeSlotsMustBeSpecified';
    }

    const calendarItems = [];

    console.log("2")
    if (inputs.classes && inputs.classes.length) {
      console.log("3")
      const classIds = inputs.classes[0].id ? _.map(inputs.classes, 'id') : inputs.classes;
      const classObjects = await ObjectionClass
        .query()
        .findByIds(classIds)
        .eager({
          class_type: true,
          teachers: true,
          room: {
            branch: true,
          },
        });
      calendarItems.push(...(_.map(
        classObjects,
        c => ({
          date: c.date,
          start_time: c.start_time,
          end_time: c.end_time,
          title: (c.cancelled ? sails.helpers.t('class.cancelled') + ', ' : '') + c.class_type.name,
          description: c.teachers.length
            ? (sails.helpers.t('global.with') + ' ' + _.map(c.teachers, 'first_name').join(', ') + '.')
            : '',
          location: c.room
            ? (c.room.name + (c.room.branch ? ', ' + c.room.branch.name : '') + '.')
            : '',
        }),
      )));
    }

    console.log("4")

    if (inputs.eventTimeSlots && inputs.eventTimeSlots.length) {
      console.log("5")
      const eventTimeSlotIds = inputs.eventTimeSlots[0].id ? _.map(inputs.eventTimeSlots, 'id') : inputs.eventTimeSlots;
      const eventTimeSlots = await ObjectionEventTimeSlot
        .query()
        .findByIds(eventTimeSlotIds)
        .eager({
          event: {
            teachers: true,
            room: {
              branch: true,
            },
          },
        });
      calendarItems.push(...(_.map(
        eventTimeSlots,
        ets => ({
          date: ets.date,
          start_time: ets.start_time,
          end_time: ets.end_time,
          title: ets.event.name,
          description: ets.event.teachers.length
            ? (sails.helpers.t('global.with') + ' ' + _.map(ets.event.teachers, 'first_name').join(', ') + '.')
            : '',
          location: ets.event.room
            ? (ets.event.room.name + (ets.event.room.branch ? ', ' + ets.event.room.branch.name : '') + '.')
            : '',
        }),
      )));
    }

    console.log("5")


    if (!calendarItems.length) {
      console.log("6")
      const escapedCalendarName = inputs.calendarName.replace(/,/g, '\\,');
      return exits.success(`BEGIN:VCALENDAR
VERSION:2.0
CALSCALE:GREGORIAN
PRODID:Yogo API
METHOD:PUBLISH
X-WR-CALNAME:${escapedCalendarName}
X-PUBLISHED-TTL:PT5M
END:VCALENDAR
`);
    }

    console.log("7")

    const icsEvents = _.map(calendarItems, calendarItem => {

      const calendarItemDateFormatted = moment(calendarItem.date).format('YYYY-MM-DD', 'Europe/Copenhagen');

      const calendarItemStart = moment.tz(calendarItemDateFormatted + ' ' + calendarItem.start_time, 'YYYY-MM-DD HH:mm:ss', 'Europe/Copenhagen');

      const calendarItemEnd = moment.tz(calendarItemDateFormatted + ' ' + calendarItem.end_time, 'YYYY-MM-DD HH:mm:ss', 'Europe/Copenhagen');

      return {
        start: calendarItemStart.utc().format('Y-M-D-H-m').split('-').map(i => parseInt(i)),
        startInputType: 'utc',
        endInputType: 'utc',
        end: calendarItemEnd.utc().format('Y-M-D-H-m').split('-').map(i => parseInt(i)),
        title: calendarItem.title,
        description: calendarItem.description,
        calName: inputs.calendarName,
        location: calendarItem.location,
      };

    });

    console.log("icsEvents = ", icsEvents)

    let {error, value} = ics.createEvents(icsEvents);

    if (error) {
      console.log("error = ", error)
      return exits.error(error);
    }

    console.log("value = ", value)

    value = value.replace(/adamgibbons\/ics/, 'Yogo API');
    value = value.replace(/X-PUBLISHED-TTL:PT1H/, 'X-PUBLISHED-TTL:PT5M');

    return exits.success(value);

  },
};
