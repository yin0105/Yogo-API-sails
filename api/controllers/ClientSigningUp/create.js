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
    },
    locale: {
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
        'locale', 
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

    const newClient = await ClientSigningUp.create(clientData).fetch();
    
    // const mailgun = require("mailgun-js");
    // const DOMAIN = 'YOUR_DOMAIN_NAME';
    // const mg = mailgun({apiKey: api_key, domain: DOMAIN});
    // const data = {
    //   from: 'Excited User <me@samples.mailgun.org>',
    //   to: 'bar@example.com, YOU@YOUR_DOMAIN_NAME',
    //   subject: 'Hello',
    //   text: 'Testing some Mailgun awesomness!'
    // };
    // mg.messages().send(data, function (error, body) {
    //   console.log(body);
    // });

    // const dbEmail = await EmailLog.create(dbEmailData).fetch();

    const emailTransport = sails.helpers.email.getTransport();
    const emailLogger = sails.helpers.logger('email');
    const messageParams = {};
    messageParams.from = sails.config.email.sendAllEmailsTo;
    messageParams.to = inputs.email;
    messageParams.html = "<h3>Subject:</h3>\
    Welcome to YOGO! Please confirm your email.\
    <h3>Text:</h3>\
    <p>Dear " + inputs.first_name + ".</p>\
    Thank you for requesting a YOGO demo. In order to create the demo, we just need to confirm your email. \
    Please click this link to confirm your email and to get started with YOGO: " + confirmLink;
    
    console.log("html = ", messageParams.html);


    try {
      emailTransport.sendMail(
        messageParams,
        async function (err, info) {
          if (err) {
            console.log("send mail error : ", err);
            emailLogger.error('Mailgun error: ' + JSON.stringify(err));
          } else {
            console.log("send mail success");
            emailLogger.info('Mailgun response: ' + JSON.stringify(info));
            const mailgunId = info.id;
          }
          return exits.success();
        },
      );
    } catch (e) {
      emailLogger.error('Mailgun threw error: ' + e.message);
    }



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
