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
    emailAlreadyInUse: {
      statusCode: 400,
      description: 'Email address already in use',
    },
    error: {
      description: 'Something went wrong',
    },
  },

  fn: async function (inputs, exits) {

    if (!await sails.helpers.can2('controller.ClientSigningUp.create', this.req, inputs)) {
      return exits.forbidden()
    }


    const logger = sails.helpers.logger('client-signing-up');

    logger.info('About to create user from yogo-onboarding');
    logger.info(inputs);

    const client = await ClientSigningUp.findOne({
      email: inputs.email,
      archived: true,
    });

    if (client) {
      logger.error('Email "' + inputs.email + '" was already used. Aborting.');
      console.log("No client");
      return exits.emailAlreadyInUse({
        message: 'Oops :) an error occurred',
        error: 'This email address already exits',
      });
    }

    const clientData = _.pick(
      inputs,
      [
        'client_name',
        'first_name',
        'last_name',
        'email',
        'password',
      ],
    );
    
    const nowTimestamp = (new Date()).getTime();
    const encryptedPassword = await User.getEncryptedPassword(inputs.password);
    const token = await sails.helpers.strings.random('url-friendly');
    const confirmLink = `${sails.config.baseUrl}/user/confirm?token=${token}`;

    // const hashedPassword = await sails.helpers.passwords.hashPassword(
    //   inputs.password
    // );

    _.assign(clientData, {
      createdAt: nowTimestamp,
      updatedAt: nowTimestamp,
      archived: false,
      encrypted_password: encryptedPassword,
      confirm_email_token: token,
      confirm_email_token_expires_at: nowTimestamp + 30 * 24 * 60 * 60 * 1000,
      confirmLink: confirmLink,
      
    });

    console.log("clientData = ", clientData);

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
