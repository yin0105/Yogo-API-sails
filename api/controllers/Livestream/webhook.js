module.exports = {
  friendlyName: 'Webhook for livestream (liveswitch.io)',

  inputs: {
    timestamp: {
      type: 'number',
    },
    origin: {
      type: 'string',
    },
    type: {
      type: 'string',
    },
    client: {
      type: 'json',
    },
    channel: {
      type: 'json',
    },
    connection: {
      type: 'json',
    },
    secret: {
      type: 'string',
      required: true
    }
  },

  exits: {
    badRequest: {
      responseType: 'badRequest'
    }
  },

  fn: async function(inputs, exits) {

    const logger = sails.helpers.logger('livestream-webhook')
    logger.info(inputs)

    if (inputs.secret !== sails.config.fmLiveswitch.webhookSecret) {
      logger.error('Provided secret is invalid')
      return exits.badRequest('Provided secret is invalid')
    }

    if (inputs.type.substr(0,11) === 'connection.' && inputs.type !== 'connection.stats') {
      const classId = inputs.connection.channelId.substr(6)

      const classItem = await Class.findOne(classId)

      await LivestreamConnectionEvent.create({
        client: classItem.client,
        class: classId,
        user: inputs.connection.userId.substr(5),
        event_timestamp: inputs.timestamp,
        event_type: inputs.type.substr(11),
        liveswitch_client_id: inputs.connection.clientId,
      })
    }

    return exits.success()
  }
}
