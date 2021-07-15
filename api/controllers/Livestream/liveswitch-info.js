module.exports = {
  friendlyName: 'Get Liveswitch info',

  fn: async function (inputs, exits) {

    return exits.success({
      applicationId: sails.config.fmLiveswitch.applicationId,
      gatewayURL: sails.config.fmLiveswitch.gatewayURL,
    })

  },
}
