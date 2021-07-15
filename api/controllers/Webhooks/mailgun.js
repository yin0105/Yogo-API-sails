const crypto = require('crypto');

module.exports = {
  friendlyName: 'Mailgun webhook',

  exits: {
    badRequest: {
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {

    const logger = sails.helpers.logger('mailgun-webhook');

    const payload = this.req.body;

    const {signature} = payload;

    const mailgunWebhookSigningKey = sails.config.email.mailgun.webhookSigningKey;

    const encodedToken = crypto
      .createHmac('sha256', mailgunWebhookSigningKey)
      .update(signature.timestamp.concat(signature.token))
      .digest('hex');

    if (encodedToken !== signature.signature) {
      logger.error('Invalid signature');
      return exits.badRequest('Invalid signature');
    }

    logger.info(payload);

    const eventData = payload['event-data'];

    const messageId = _.get(eventData, "message.headers['message-id']");
    if (!messageId) {
      logger.info('No message ID');
      return exits.success();
    }

    await EmailLog.update({email_provider_id: '<' + messageId + '>'}, {email_provider_status: eventData.event});

    return exits.success();

  },
};
