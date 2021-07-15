const request = require('request')

module.exports = {
  friendlyName: 'SMS transport via GatewayAPI',

  inputs: {
    msisdn: {
      type: 'string',
      required: true,
    },
    message: {
      type: 'string',
      required: true,
    },
    sender: {
      type: 'string',
      required: true,
    },
  },

  exits: {
    sendFailed: {},
  },

  fn: async (inputs, exits) => {

    const smsLogger = sails.helpers.logger('sms')

    request.post({
      url: 'https://gatewayapi.com/rest/mtsms',
      oauth: {
        consumer_key: sails.config.sms.gatewayApi.apiKey,
        consumer_secret: sails.config.sms.gatewayApi.apiSecret,
      },
      json: true,
      body: {
        'class': 'premium',
        //priority: 'URGENT', // Wonder what exactly this does
        sender: inputs.sender,
        message: inputs.message,
        recipients: [{msisdn: inputs.msisdn}],
      },
    }, function (err, response, body) {

      if (err) {
        // There might be an issue with logging sms errors, so for now, also log errors to console.
        console.log(err)
        smsLogger.error(err)
      }
      smsLogger.info(body)

      if (err) {
        return exits.sendFailed(body)
      }

      if (response.statusCode === 200) {
        return exits.success(body)
      } else {
        return exits.sendFailed(body)
      }

    })

  },
}
