const moment = require('moment')
const crypto = require('crypto')

module.exports = {
  friendlyName: 'Calculate webhook signature',

  inputs: {
    client: {
      type: 'ref',
      required: true,
      description: 'Client id or object'
    },
    timestamp: {
      type: 'string',
      description: 'The timestamp when the webhook was triggered',
      required: true,
      custom: ts => moment(ts, moment.ISO_8601).isValid()
    },
    id: {
      type: 'string',
      description: 'The webhook ID',
      required: true
    }
  },

  exits: {

  },

  fn: async (inputs, exits) => {
    const webhookSecret = await sails.helpers.clientSettings.find.with( {
      client: inputs.client,
      keys: 'payment_service_provider_reepay_webhook_secret',
      includeSecrets: true
    })

    const signature = crypto
      .createHmac('sha256', webhookSecret)
      .update(inputs.timestamp + inputs.id)
      .digest('hex');

    return exits.success(signature)

  }

}
