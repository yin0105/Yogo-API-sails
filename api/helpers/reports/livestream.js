const moment = require('moment-timezone');
const ObjectionClass = require('../../objection-models/Class');

const classConnectionEventsToSessions = classConnectionEvents => {
  return _.chain(classConnectionEvents)
    .groupBy('liveswitch_client_id')
    .mapValues(clientConnectionEventsToSessions)
    .values()
    .flatten()
    .value();
};

const clientConnectionEventsToSessions = sessionEvents => {
  const sessions = [];
  let currentSession = null;
  while (sessionEvents.length) {

    const nextEvent = sessionEvents.shift();

    if (!currentSession && nextEvent.event_type === 'connected') {
      currentSession = {
        start: nextEvent.event_timestamp,
        liveswitch_client_id: nextEvent.liveswitch_client_id,
        'class': nextEvent.class,
        user: nextEvent.user,
      };
    }
    if (currentSession && _.includes(['closed', 'failed'], nextEvent.event_type)) {
      currentSession.end = nextEvent.event_timestamp;
      currentSession.livestream_seconds = Math.ceil((currentSession.end - currentSession.start) / 1000);
      sessions.push(currentSession);
      currentSession = null;
    }

  }
  return sessions;

};


const mapSessionsToTotals = (sessions) => {
  const numberOfParticipants = _.chain(sessions)
    .map('user')
    .uniq()
    .value()
    .length;
  const totalSeconds = _.chain(sessions)
    .map('livestream_seconds')
    .sum()
    .value();

  return {
    totalSeconds,
    numberOfParticipants,
  };
};

module.exports = {
  friendlyName: 'Livestream usage data',

  inputs: {
    client: {
      type: 'ref',
      required: true,
    },

    startDate: {
      type: 'string',
      required: true,
      custom: sd => sd.match(/^\d\d\d\d-\d\d-\d\d$/),
    },

    endDate: {
      type: 'string',
      required: true,
      custom: ed => ed.match(/^\d\d\d\d-\d\d-\d\d$/),
    },
  },

  exits: {
    dateIntervalTooLong: {},
  },

  fn: async (inputs, exits) => {

    const startDate = moment.tz(inputs.startDate, 'Europe/Copenhagen');
    const endDate = moment.tz(inputs.endDate, 'Europe/Copenhagen');
    if (moment(startDate).add(1, 'year').subtract(1, 'day').isBefore(endDate, 'day')) {
      throw 'dateIntervalTooLong';
    }

    const classes = await ObjectionClass.query()
      .where({
        client: sails.helpers.util.idOrObjectIdInteger(inputs.client),
        archived: 0,
        cancelled: 0,
        livestream_enabled: 1,
      })
      .andWhere('date', '>=', startDate.format('YYYY-MM-DD'))
      .andWhere('date', '<=', endDate.format('YYYY-MM-DD'))
      .orderBy(['date', 'start_time'])
      .eager({
        teachers: true,
        class_type: true,
      });

    const classIds = _.map(classes, 'id');

    const connectionEvents = await knex({lce: 'livestream_connection_event'})
      .where({
        'lce.client': sails.helpers.util.idOrObjectIdInteger(inputs.client),
        'lce.archived': 0,
      })
      .andWhere('lce.class', 'in', classIds)
      .andWhere('lce.event_type', 'in', ['connected', 'closed', 'failed'])
      .orderBy('lce.event_timestamp');


    const classSessionData = _.chain(connectionEvents)
      .groupBy('class')
      .mapValues(classConnectionEventsToSessions)
      .mapValues(mapSessionsToTotals)
      .value();

    _.each(classes, (classItem) => {
      classItem.totalSeconds = classSessionData[classItem.id] ? classSessionData[classItem.id].totalSeconds : 0;
      classItem.numberOfParticipants = classSessionData[classItem.id] ? classSessionData[classItem.id].numberOfParticipants : 0;
    });

    return exits.success(classes);

  },

};
