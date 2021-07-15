module.exports = {

  friendlyName: 'Send email',

  description: 'Sends email using Mailgun',

  inputs: {

    user: {
      type: 'ref',
      description: 'The email recipient.',
    },

    non_user_email: {
      type: 'string',
      isEmail: true,
      description: 'If user is not supplied, this param ia required.',
    },

    client: {
      type: 'ref',
      description: 'If user is not supplied, this is required',
    },

    subject: {
      type: 'string',
      description: 'The email subject',
      required: true,
    },

    subjectForLog: {
      type: 'string',
      description: 'The email subject, REDACTED. If not provided, the regular subject will be logged.',
      required: false,
    },

    text: {
      type: 'string',
      description: 'The email body as non-formatted text',
      required: true,
    },

    textForLog: {
      type: 'string',
      description: 'The email body as non-formatted text, REDACTED. If not provided, the regular text will be logged.',
      required: false,
    },

    html: {
      type: 'string',
      description: 'The email body as HTML. Will be auto-generated from text body if it is not provided.',
      required: false,
    },

    htmlForLog: {
      type: 'string',
      description: 'The email body as HTML, REDACTED. Will be auto-generated from textForLog if not provided.',
      required: false,
    },

    attachments: {
      type: 'ref',
      description: 'File attachments',
      required: false,
    },

    blindCopyToClient: {
      type: 'boolean',
      description: 'Sends a bcc to the client',
      defaultsTo: false,
    },

    emailType: {
      type: 'string',
      required: true,
    },

    classId: {
      type: 'ref',
      description: 'Used if relevant for the email type',
    },

    classEmailId: {
      type: 'ref',
      description: 'Only used if the email type is "class_email"',
    },

    classTypeEmailId: {
      type: 'ref',
      description: 'Only used if the email type is "class_type_email"',
    },

  },

  exits: {
    userOrEmailAndClientRequired: {
      description: 'User or email/client required',
    },
  },

  fn: async (inputs, exits) => {

    if (
      !inputs.user
      && (
        !inputs.non_user_email
        || !inputs.client
      )
    ) {
      throw 'userOrEmailAndClientRequired';
    }

    const emailLogger = sails.helpers.logger('email');

    const messageParams = _.pick(inputs, [
      'subject',
      'text',
      'html',
      'attachments',
    ]);

    let client, user;
    if (inputs.user) {
      user = await User.findOne(sails.helpers.util.idOrObjectIdInteger(inputs.user));
      client = await Client.findOne(user.client);
      messageParams.to = user.email;
    } else {
      client = await Client.findOne(sails.helpers.util.idOrObjectIdInteger(inputs.client));
      messageParams.to = inputs.non_user_email;
    }

    messageParams.from = '"' + client.name + '" <noreply@yogo.dk>';

    // Blind copies
    if (sails.config.email.sendBlindCopyOfAllEmailsTo) {
      messageParams.bcc = sails.helpers.util.castArrayOrCommaSeparatedStringToArray(
        sails.config.email.sendBlindCopyOfAllEmailsTo,
      );
    }

    if (inputs.blindCopyToClient) {
      const clientBccRecipient = await sails.helpers.clientSettings.find(client, 'email_bcc_to_client_send_to');

      messageParams.bcc = _.uniq(_.concat(
        sails.helpers.util.castArrayOrCommaSeparatedStringToArray(messageParams.bcc),
        sails.helpers.util.castArrayOrCommaSeparatedStringToArray(clientBccRecipient),
      ));
    }

    //
    // Safety
    //
    emailLogger.info(
      'sails.config.email:' + JSON.stringify(sails.config.email),
    );
    if (!sails.config.email.sendRealEmails) {
      messageParams.to = sails.config.email.sendAllEmailsTo;
      delete messageParams.cc;
      delete messageParams.bcc;
    }


    // Auto-generate html version if not provided
    if (!messageParams.html) {
      messageParams.html = sails.helpers.string.textToHtml(messageParams.text);
    }


    const logEntry = _.omit(messageParams, 'attachments');
    if (messageParams.attachments) {
      logEntry.attachments = _.map(messageParams.attachments, 'filename');
    }
    emailLogger.info(logEntry);

    const dbEmailData = _.assign(logEntry, {
      client_id: client.id,
      user_id: user ? user.id : undefined,
      email_type: inputs.emailType,
      class_id: inputs.classId,
      class_email_id: inputs.classEmailId || undefined,
      class_type_email_id: inputs.classTypeEmailId || undefined,
    });
    dbEmailData.bcc = dbEmailData.bcc ? dbEmailData.bcc.join(',') : undefined;
    dbEmailData.attachments = dbEmailData.attachments ? dbEmailData.attachments.join(',') : undefined;

    if (inputs.subjectForLog) {
      dbEmailData.subject = inputs.subjectForLog;
    }
    if (inputs.textForLog) {
      dbEmailData.text = inputs.textForLog;
      if (!inputs.htmlForLog) {
        dbEmailData.html = sails.helpers.string.textToHtml(inputs.textForLog);
      }
    }
    if (inputs.htmlForLog) {
      dbEmailData.html = inputs.htmlForLog;
    }

    const dbEmail = await EmailLog.create(dbEmailData).fetch();

    const emailTransport = sails.helpers.email.getTransport();

    try {
      emailTransport.sendMail(
        messageParams,
        async function (err, info) {
          if (err) {
            emailLogger.error('Mailgun error: ' + JSON.stringify(err));
          } else {
            emailLogger.info('Mailgun response: ' + JSON.stringify(info));
            const mailgunId = info.id;
            await EmailLog.update({id: dbEmail.id}, {email_provider_id: mailgunId});
          }
          return exits.success();
        },
      );
    } catch (e) {
      emailLogger.error('Mailgun threw error: ' + e.message);
    }

  },

};
