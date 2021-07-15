module.exports = {
  friendlyName: 'Send admin-to-customer email for a class',

  description: 'This helper sends the admin-to-customer email to the specified signup groups.',

  inputs: {
    email: {
      type: 'ref',
      required: true,
      description: 'The email to check, either as id or object.',
    },

  },

  exits: {
    emailNotFound: {
      description: 'Email does not exist',
    },
  },

  fn: async (inputs, exits) => {

    const logger = sails.helpers.logger('class-emails');

    logger.info('Starting classEmail.send.js');

    let email = await sails.helpers.util.objectFromObjectOrObjectId(inputs.email, ClassEmail);

    [email] = await ClassEmail.update({
      id: email.id,
      now_processing: false,
    }, {
      now_processing: true,
    }).fetch();

    if (!email) {
      logger.info('Could not lock email for sending. Email already locked.');
      return exits.success();
    }

    logger.info('Class email locked for processing.');

    const recipientIds = [];
    if (email.send_to_signups) {
      const signups = await ClassSignup.find({'class': email.class_id, archived: false, cancelled_at: 0});
      const signupUserIds = _.map(signups, 'user');
      recipientIds.push(...signupUserIds);
    }
    if (email.send_to_waiting_list) {
      const waitingListSignups = await ClassWaitingListSignup.find({'class': email.class_id, archived: false, cancelled_at: 0});
      const waitingListSignupUserIds = _.map(waitingListSignups, 'user');
      recipientIds.push(...waitingListSignupUserIds);
    }
    if (email.send_to_livestream_signups) {
      const livestreamSignups = await ClassLivestreamSignup.find({'class': email.class_id, archived: false, cancelled_at: 0});
      const livestreamSignupUserIds = _.map(livestreamSignups, 'user');
      recipientIds.push(...livestreamSignupUserIds);
    }

    const sentInstances = await ClassEmailInstance.find({
      class_email_id: email.id,
      archived: false,
    });

    const newRecipientIds = _.difference(
      recipientIds,
      _.map(sentInstances, 'recipient_id'),
    );

    const newRecipients = await User.find({id: newRecipientIds});

    await Promise.all(_.map(
      newRecipients,
      async (recipient) => {
        const [subject, body] = await sails.helpers.string.fillInVariables([email.subject, email.body], {}, {customer: recipient});

        logger.info('Sending email ' + email.id + ' to user ' + recipient.id);
        await sails.helpers.email.send.with({
          user: recipient,
          subject: subject,
          text: body,
          emailType: 'class_email',
        });
      },
    ));

    const newInstanceData = _.map(
      newRecipientIds,
      recipientId => ({
        client_id: email.client_id,
        class_email_id: email.id,
        recipient_id: recipientId,
      }),
    );

    await ClassEmailInstance.createEach(newInstanceData);

    await ClassEmail.update({id: email.id}, {now_processing: false});

    logger.info('email unlocked');

    return exits.success();

  },
};
