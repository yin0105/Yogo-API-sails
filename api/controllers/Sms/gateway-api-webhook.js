const jwt = require('jsonwebtoken')

module.exports = {

  friendlyName: 'Webhook for Gateway API SMS service',

  inputs: {
    id: {
      type: 'number',
      description: 'The ID of the SMS/MMS this notification concerns',
    },
    msisdn: {
      type: 'string',
      description: 'The MSISDN of the mobile recipient.',
    },
    time: {
      type: 'number',
      description: 'The UNIX Timestamp for the delivery status event',
    },
    status: {
      type: 'string',
      description: 'State, in all-caps, ie. DELIVERED',
    },
    error: {
      type: 'string',
      description: 'Optional error decription, if available.',
      allowNull: true
    },
    code: {
      type: 'string',
      description: 'Optional numeric code, in hex, see SMS Errors, if available.',
      allowNull: true
    },
  },

  fn: async function (inputs, exits) {

    const smsLogger = sails.helpers.logger('sms')
    smsLogger.info(inputs)

    smsLogger.info(this.req.headers)
    const authHeader = this.req.headers['x-gwapi-signature']
    smsLogger.info(authHeader)

    const secret = sails.config.sms.gatewayApi.webhookSecret

    var decoded = jwt.verify(authHeader, secret)
    smsLogger.info(decoded)

    if (!decoded.status) {
      // This is not a status update
      return exits.success()
    }

    const status = decoded.error ?
      decoded.status + ' - ' + decoded.error + ' ' + decoded.code :
      decoded.status

    await Sms.update({sms_provider_id: decoded.id}, {
      sms_provider_status: status,
      sms_provider_status_time: decoded.time
    })

    return exits.success()

  },

}
