const moment = require('moment-timezone');

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
        parsedUserAgent: JSON.parse(nextEvent.user_agent_parsed),
        role: nextEvent.role,
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

module.exports = {
  friendlyName: 'Livestream details, single class',

  inputs: {
    class: {
      type: 'ref',
      required: true,
    },
  },

  fn: async (inputs, exits) => {

    const classId = sails.helpers.util.idOrObjectIdInteger(inputs.class);

    const query = knex({lce: 'livestream_connection_event'})
      .select(
        'lce.*',
        knex({lc: 'livestream_client'})
          .select('role')
          .where('liveswitch_client_id', knex.raw('lce.liveswitch_client_id'))
          .limit(1)
          .as('role'),
        knex({lc: 'livestream_client'})
          .select('user_agent_parsed')
          .where('liveswitch_client_id', knex.raw('lce.liveswitch_client_id'))
          .limit(1)
          .as('user_agent_parsed'),
      )
      .andWhere({
        'lce.class': classId,
        'lce.archived': 0,
      })
      .andWhere('lce.event_type', 'in', ['connected', 'closed', 'failed'])
      .orderBy('lce.event_timestamp');

    const connectionEvents = await query;

    const sessions = _.chain(connectionEvents)
      .groupBy('liveswitch_client_id')
      .mapValues(clientConnectionEventsToSessions)
      .values()
      .flatten()
      .value();

    const userIds = _.chain(sessions)
      .map('user')
      .uniq()
      .value();

    const users = await User.find({id: userIds});
    _.each(
      sessions,
      (session) => {
        session.user = _.find(users, {id: session.user});
        session.start = moment(session.start, 'x').tz('Europe/Copenhagen').format('HH:mm:ss');
        session.end = moment(session.end, 'x').tz('Europe/Copenhagen').format('HH:mm:ss');
      },
    );

    return exits.success(sessions);

  },

};
