const moment = require('moment-timezone');

module.exports = {

  friendlyName: 'Create new user from yogo-onboarding',

  inputs: {
    client_name: {
      type: 'string',
      required: true,
    },
    first_name: {
      type: 'string',
      required: true,
    },
    last_name: {
      type: 'string',
      required: true,
    },
    email: {
      type: 'string',
      required: true,
    },
    password: {
      type: 'string',
      required: true,
    }
  },

  exits: {
    classNotFound: {
      responseType: 'badRequest',
    },
    forbidden: {
      responseType: 'forbidden'
    }
  },

  fn: async function (inputs, exits) {
    console.log(inputs);

  //   if (!await sails.helpers.can2('controller.ClassEmails.create', this.req, inputs)) {
  //     return exits.forbidden()
  //   }

  //   const logger = sails.helpers.logger('class-emails');

  //   logger.info('About to create email with subject "' + inputs.subject + '" for class id ' + inputs.class_id);
  //   logger.info(inputs);

  //   const classObj = await Class.findOne({
  //     id: inputs.class_id,
  //     client: this.req.client.id,
  //     archived: false,
  //   });

  //   if (!classObj) {
  //     logger.error('Class ' + inputs.class_id + ' not found. Aborting.');
  //     return exits.classNotFound('E_CLASS_NOT_FOUND');
  //   }

  //   const classEmailData = _.pick(
  //     inputs,
  //     [
  //       'subject',
  //       'body',
  //       'class_id',
  //       'send_at_datetime',
  //       'send_to_signups',
  //       'send_to_livestream_signups',
  //       'send_to_waiting_list',
  //     ],
  //   );

  //   _.assign(classEmailData, {
  //     client_id: this.req.client.id,
  //     sender_id: this.req.user.id,
  //     email_sent: false,
  //   });

  //   const sendAtDateTime = moment.tz(inputs.send_at_datetime, 'YYYY-MM-DD HH:mm:ss', 'Europe/Copenhagen');

  //   const sendNow = sendAtDateTime.isSameOrBefore(
  //     moment.tz('Europe/Copenhagen'),
  //     'minute',
  //   );

  //   const classDateString = moment(classObj.date).format('YYYY-MM-DD', 'Europe/Copenhagen');
  //   const classStart = moment.tz(classDateString + ' ' + classObj.start_time, 'Europe/Copenhagen');

  //   const sendEmailDateTimeIsBeforeClassStart = sendAtDateTime.isBefore(classStart, 'minute');

  //   const sendToSubsequentSignups = inputs.send_to_subsequent_signups && sendEmailDateTimeIsBeforeClassStart;

  //   _.assign(classEmailData, {
  //     send_to_subsequent_signups: sendToSubsequentSignups,
  //     email_sent: false,
  //     auto_send_status: 'off',
  //   });

  //   const classEmail = await ClassEmail.create(classEmailData).fetch();

  //   logger.info('Email created.');

  //   if (sendNow) {
  //     logger.info('Now sending email');
  //     await sails.helpers.classEmail.send(classEmail);
  //   } else {
  //     logger.info('Email scheduled for sending later');
  //   }

  //   await ClassEmail.update({id: classEmail.id}, {
  //     email_sent: sendNow,
  //     auto_send_status: sendToSubsequentSignups ? 'active' : 'off',
  //   });

  //   return exits.success();

  },

};
