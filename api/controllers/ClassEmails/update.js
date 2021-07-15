const moment = require('moment-timezone');
const ObjectionClassEmail = require('../../objection-models/ClassEmail');
module.exports = {

  friendlyName: 'Update class email',

  inputs: {
    id: {
      type: 'number',
      required: true,
    },
    subject: {
      type: 'string',
    },
    body: {
      type: 'string',
    },
    send_at_datetime: {
      type: 'string',
    },
    send_to_signups: {
      type: 'boolean',
    },
    send_to_livestream_signups: {
      type: 'boolean',
    },
    send_to_waiting_list: {
      type: 'boolean',
    },
    send_to_subsequent_signups: {
      type: 'boolean',
    },
  },

  exits: {
    classNotFound: {
      responseType: 'badRequest',
    },
    forbidden: {
      responseType: 'forbidden',
    },
  },

  fn: async function (inputs, exits) {

    if (!await sails.helpers.can2('controller.ClassEmails.update', this.req, inputs)) {
      return exits.forbidden();
    }

    const logger = sails.helpers.logger('class-emails');

    logger.info('About to update class email, id ' + inputs.id);
    logger.info(inputs);

    const existingClassEmail = await ObjectionClassEmail.query()
      .where({id: inputs.id})
      .first()
      .eager('class');

    const classObj = existingClassEmail.class;

    const classEmailData = _.pick(
      inputs,
      [
        'subject',
        'body',
        'send_at_datetime',
        'send_to_signups',
        'send_to_livestream_signups',
        'send_to_waiting_list',
      ],
    );


    const sendAtDateTime = moment.tz(inputs.send_at_datetime, 'YYYY-MM-DD HH:mm:ss', 'Europe/Copenhagen');

    const sendNow = sendAtDateTime.isSameOrBefore(
      moment.tz('Europe/Copenhagen'),
      'minute',
    );

    const classDateString = moment(classObj.date).format('YYYY-MM-DD', 'Europe/Copenhagen');
    const classStart = moment.tz(classDateString + ' ' + classObj.start_time, 'Europe/Copenhagen');

    const sendEmailDateTimeIsBeforeClassStart = sendAtDateTime.isBefore(classStart, 'minute');

    const sendToSubsequentSignups = inputs.send_to_subsequent_signups && sendEmailDateTimeIsBeforeClassStart;

    _.assign(classEmailData, {
      send_to_subsequent_signups: sendToSubsequentSignups,
      auto_send_status: sendToSubsequentSignups ? 'active' : 'off',
    });

    logger.info('Updating with data:', classEmailData);

    const [classEmail] = await ClassEmail.update({id: inputs.id}, classEmailData).fetch();

    logger.info('Email updated.');

    if (sendNow) {

      logger.info('Now sending email');
      await sails.helpers.classEmail.send(classEmail);
      await ClassEmail.update({id: classEmail.id}, {
        email_sent: true,
      });

    } else {
      logger.info('Email scheduled for sending later');
    }

    return exits.success();

  },

};
