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
    sendingMailFailed: {
      statusCode: 400,
      description: 'Sending mail failed',
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

    const client = await ClientSigningUp.find({
      email: inputs.email,
      archived: true,
    });

    if (client.length > 0) {
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
    const confirmLink = `${sails.config.baseUrl}/client-signing-up/confirm?token=${token}`;

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

    messageParams.html = "<h3>" + sails.helpers.t('email.Subject', '', inputs.locale) + ":</h3>" + 
      sails.helpers.t('email.WelcomeToYogo', '', inputs.locale) + "! " + 
      sails.helpers.t('email.PleaseConfirmEmail', '', inputs.locale) + ".<h3>" + 
      sails.helpers.t('email.Text', '', inputs.locale) + ":</h3><p>" + 
      sails.helpers.t('email.Dear', '', inputs.locale) + " " + inputs.first_name + ".</p>" + 
      sails.helpers.t('email.ThanksForRequesting', '', inputs.locale) + ". " + 
      sails.helpers.t('email.ConfirmYourEmail', '', inputs.locale) + ". " + 
      sails.helpers.t('email.GetStartedWithYogo', '', inputs.locale) + ": <a href='" + confirmLink + "'>" + confirmLink + "</a>";
    
    console.log("html = ", messageParams.html);

    try {
      emailTransport.sendMail(
        messageParams,
        async function (err, info) {
          if (err) {
            console.log("send mail error : ", err);
            emailLogger.error('Mailgun error: ' + JSON.stringify(err));
            return exits.sendingMailFailed({
              message: 'Oops :) an error occurred',
              error: 'Sending mail failed',
            });
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
      return exits.error({
        message: 'Oops :) an error occurred',
        error: 'Something went wrong',
      });
    }
  },

};
