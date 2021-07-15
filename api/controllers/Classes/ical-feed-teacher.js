const moment = require('moment-timezone');
const ObjectionClass = require('../../objection-models/Class');
const ObjectionEventTimeSlot = require('../../objection-models/EventTimeSlot');

module.exports = {
  friendlyName: 'Teacher ICS feed',

  inputs: {
    teacherIcalToken: {
      type: 'string',
      required: true,
    },
  },

  exits: {
    invalidToken: {
      responseType: 'forbidden',
    },
  },

  fn: async function (inputs, exits) {

    const teacher = await User.findOne({
      id: this.req.param('teacherId'),
      teacher_ical_token: inputs.token,
      client: this.req.client.id,
      archived: 0,
      teacher: 1,
    });

    if (!teacher) {
      return exits.invalidToken();
    }

    const classes = await ObjectionClass
      .query()
      .alias('c')
      .joinRelation('teachers', {alias: 't'})
      .where('date', '>=', moment.tz('Europe/Copenhagen').subtract(6, 'months').format('YYYY-MM-DD'))
      .andWhere('date', '<=', moment.tz('Europe/Copenhagen').add(1, 'year').format('YYYY-MM-DD'))
      .andWhere({
        'c.archived': 0,
        't.id': this.req.param('teacherId'),
      });

    const eventTimeSlots = await ObjectionEventTimeSlot
      .query()
      .alias('ets')
      .joinRelation({
        'event': {
          'teachers': true,
        },
      })
      .where('date', '>=', moment.tz('Europe/Copenhagen').subtract(6, 'months').format('YYYY-MM-DD'))
      .andWhere('date', '<=', moment.tz('Europe/Copenhagen').add(1, 'year').format('YYYY-MM-DD'))
      .andWhere({
        'ets.archived': 0,
        'event.archived': 0,
        'event:teachers.id': this.req.param('teacherId'),
      });

    const client = await Client.findOne({id: teacher.client});

    const calendarName = client.name + ' - ' + teacher.first_name + ' ' + teacher.last_name;

    const iCalData = await sails.helpers.ical.generateCalendarFeed.with({
      classes,
      eventTimeSlots,
      calendarName,
    });

    return exits.success(iCalData);

  },
};
