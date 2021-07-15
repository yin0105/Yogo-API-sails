const moment = require('moment-timezone');

module.exports = {

  friendlyName: 'Tick, send livestream notification emails',

  description: 'Check if there are signups for online classes that need to receive the notification email.',

  fn: async function (inputs, exits) {

    const logger = sails.helpers.logger('livestream-notification-emails');
    logger.info('Starting send-livestream-notification-emails');

    const maxMinutesBeforeStart = await sails.helpers.clientSettings.getMax('livestream_send_email_to_customers_minutes_before_class_start');
    const defaultNumberOfMinutesBeforeStart = await sails.helpers.clientSettings.getDefault('livestream_send_email_to_customers_minutes_before_class_start');

    const livestreamSignupsToConsider = await knex({cls: 'class_livestream_signup'})
      .select(
        'cls.id',
        'cls.client',
        'cls.id',
        knex.raw(`CONCAT(c.date, ' ', c.start_time) AS start`),
        knex.raw('IFNULL(c_settings.value, ?)  AS send_email_minutes_before_start', defaultNumberOfMinutesBeforeStart),
      )
      .innerJoin({c: 'class'}, 'cls.class', 'c.id')
      .where({
        'c.archived': false,
        'c.cancelled': 0,
        'cls.archived': false,
        'cls.cancelled_at': 0,
        'cls.notification_email_sent': false,
      })
      .andWhere('c.date', '=', moment.tz('Europe/Copenhagen').format('YYYY-MM-DD'))
      .andWhere('c.start_time', '>=', moment.tz('Europe/Copenhagen').format('HH:mm:ss'))
      .andWhere('c.start_time', '<=', moment.tz('Europe/Copenhagen').add(maxMinutesBeforeStart, 'minutes').format('HH:mm:ss'))
      .leftJoin({c_settings: 'client_settings'}, function () {
        this.on('cls.client', 'c_settings.client')
          .on('c_settings.key', knex.raw('?', ['livestream_send_email_to_customers_minutes_before_class_start']));
      })
    ;

    const now = moment.tz('Europe/Copenhagen');
    const livestreamSignupsToSendNotification = _.filter(
      livestreamSignupsToConsider,
      signup => now.isSameOrAfter(
        moment.tz(signup.start, 'YYYY-MM-DD HH:mm:ss', 'Europe/Copenhagen').subtract(signup.send_email_minutes_before_start, 'minutes'),
      ),
    );

    if (livestreamSignupsToSendNotification.length) {
      logger.info('Sending livestream notification emails to ' + livestreamSignupsToSendNotification.length + ' signups')
    } else {
      logger.info('Sending no livestream notification emails')
    }

    await Promise.all(
      _.map(
        livestreamSignupsToSendNotification,
        livestreamSignup => sails.helpers.email.customer.yourClassLivestreamWillBeginShortly(livestreamSignup),
      ),
    );

    return exits.success();

  },

};
