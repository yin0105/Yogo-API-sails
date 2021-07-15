const ClassObj = require('../../objection-models/Class');
const ClassTypeEmailObj = require('../../objection-models/ClassTypeEmail');
const moment = require('moment-timezone');
module.exports = {

  friendlyName: 'Tick, send class type notification emails',

  description: 'Check if there are pending reminders for classes (class type emails).',

  fn: async function (inputs, exits) {

    const startTimestamp = Date.now();

    const logger = sails.helpers.logger('class-type-notification-emails');
    logger.info('Starting send-class-type-notification-emails');

    const classTypeEmailReminders = await ClassTypeEmailObj.query().alias('cte')
      .innerJoin({cl: 'client'}, 'cte.client_id', 'cl.id')
      .where({
        'cte.send_at': 'minutes_before_class',
        'cte.archived': 0,
        'cl.archived': 0,
      })
      .select([
        'cte.*',
      ])
      .eager({
        client: true,
      })
    ;

    //console.log('classTypeEmailReminders:', classTypeEmailReminders);

    for (let i = 0; i < classTypeEmailReminders.length; i++) {

      const classTypeEmailReminder = classTypeEmailReminders[i];

      const classStartEarliest = moment.tz('Europe/Copenhagen');

      const classStartLatest = moment.tz('Europe/Copenhagen').add(classTypeEmailReminder.minutes_before_class, 'minutes');

      const classQuery = ClassObj.query().alias('c')
        .innerJoin({ct: 'class_type'}, 'ct.id', 'c.class_type')
        .innerJoin({ctect: 'class_type_email_class_type'}, 'ctect.class_type_id', 'ct.id')
        .innerJoin({cte: 'class_type_email'}, 'cte.id', 'ctect.class_type_email_id')
        .where({
          'cte.id': classTypeEmailReminder.id,
          'ct.archived': 0,
          'c.archived': 0,
          'c.cancelled': 0,
        })
        .whereRaw("TIMESTAMP(c.date, c.start_time) >= TIMESTAMP(?, ?)", [
          classStartEarliest.format('YYYY-MM-DD'),
          classStartEarliest.format('HH:mm:ss'),
        ])
        .whereRaw("TIMESTAMP(c.date, c.start_time) <= TIMESTAMP(?, ?)", [
          classStartLatest.format('YYYY-MM-DD'),
          classStartLatest.format('HH:mm:ss'),
        ])
        .select([
          'c.*',
        ])
        .eager({
          signups: !!classTypeEmailReminder.send_to_signups,
          livestream_signups: !!classTypeEmailReminder.send_to_livestream_signups,
          waiting_list_signups: !!classTypeEmailReminder.send_to_waiting_list,
          sent_emails: true,
        })
        .modifyEager('signups', builder => builder.where({archived: 0, cancelled_at: 0}))
        .modifyEager('livestream_signups', builder => builder.where({archived: 0, cancelled_at: 0}))
        .modifyEager('waiting_list_signups', builder => builder.where({archived: 0, cancelled_at: 0}))
        .modifyEager('sent_emails', builder => builder.where({class_type_email_id: classTypeEmailReminder.id}))
      ;

      const classesInsideTimeWindow = await classQuery;

      //console.log('classesInsideTimeWindow:', classesInsideTimeWindow);

      const locale = await sails.helpers.clientSettings.find(classTypeEmailReminder.client_id, 'locale');

      for (let j = 0; j < classesInsideTimeWindow.length; j++) {

        const classObj = classesInsideTimeWindow[j];

        let allSignups = _.concat(
          classTypeEmailReminder.send_to_signups ? classObj.signups : [],
          classTypeEmailReminder.send_to_livestream_signups ? classObj.livestream_signups : [],
          classTypeEmailReminder.send_to_waiting_list ? classObj.waiting_list_signups : [],
        );

        if (!classTypeEmailReminder.send_to_subsequent_signups) {
          //console.log('classObj.date + \' \' + classObj.start_time:', classObj.date + ' ' + classObj.start_time);
          const reminderTimestamp = moment.tz(classObj.date + ' ' + classObj.start_time, 'Europe/Copenhagen')
            .subtract(classTypeEmailReminder.minutes_before_class, 'minutes')
            .format('x');
          allSignups = _.filter(allSignups, signup => {
            //console.log('signup.createdAt:', signup.createdAt);
            //console.log('reminderTimestamp:', reminderTimestamp);
            return signup.createdAt <= reminderTimestamp;
          });
        }

        //console.log('classObj.sent_emails:', classObj.sent_emails);

        const pendingRecipientIds = _.chain(allSignups)
          .uniqBy('user_id')
          .differenceBy(classObj.sent_emails, 'user_id')
          .map('user_id')
          .value();

        //console.log('pendingRecipientIds:', pendingRecipientIds);

        await Promise.all(_.map(
          pendingRecipientIds,
          async (recipientId) => {

            const [subject, body] = await sails.helpers.string.fillInVariables(
              [classTypeEmailReminder.subject, classTypeEmailReminder.body],
              {},
              {
                customer: recipientId,
                studio: classTypeEmailReminder.client,
                class: classObj,
              },
              locale,
            );

            logger.info('Sending class type email ' + classTypeEmailReminder.id + ' with subject ' + classTypeEmailReminder.subject + ' to user ' + recipientId + ' for class ' + classObj.id + ', ' + classObj.date + ' ' + classObj.start_time);
            await sails.helpers.email.send.with({
              user: recipientId,
              subject: subject,
              text: body,
              emailType: 'class_type_email',
              classId: classObj.id,
              classTypeEmailId: classTypeEmailReminder.id,
            });
          }));

      }

    }

    const endTimestamp = Date.now();

    const elapsedTimeInSeconds = (endTimestamp - startTimestamp) / 1000;
    logger.info('Sending completed in ' + elapsedTimeInSeconds + ' seconds!');
    if (elapsedTimeInSeconds > 60) {
      throw new Error('Sending class type emails took more than 1 minute. ');
    }

    return exits.success();

  },

};
