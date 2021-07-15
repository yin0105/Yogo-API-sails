const fmLiveswitch = require('fm.liveswitch')
const moment = require('moment-timezone');
const userAgentParser = require('ua-parser-js');

module.exports = {
  friendlyName: 'Get Liveswitch auth token',

  description: 'Generates an auth token for the client to use for registering itself',

  inputs: {
    deviceId: {
      type: 'string',
      required: true,
    },
    clientId: {
      type: 'string',
      description: 'Liveswitch client ID',
      required: true,
    },
    classId: {
      type: 'number',
      required: true,
    },
  },

  exits: {
    classHasWrongClient: {
      responseType: 'badRequest',
    },
    classIsNotToday: {
      responseType: 'badRequest'
    },
    forbidden: {
      responseType: 'forbidden'
    }
  },

  fn: async function (inputs, exits) {

    if (!await sails.helpers.can2('controller.Livestream.get-register-client-for-class-auth-token', this.req)) {
      return exits.forbidden()
    }

    const classItem = await Class.findOne(inputs.classId)

    if (parseInt(classItem.client) !== parseInt(this.req.client.id)) {
      return exits.classHasWrongClient('Class has wrong client')
    }

    const today = moment.tz('Europe/Copenhagen')
    const classDate = sails.helpers.util.normalizeDate(classItem.date)
    if (!classDate.isSame(today, 'day')) {
      return exits.success(
        await sails.helpers.applicationError.buildResponse('classIsNotToday', this.req)
      );
    }

    const channelId = 'class-' + inputs.classId

    const role = this.req.authorizedRequestContext

    const channelClaim = new fmLiveswitch.ChannelClaim(channelId);
    if (role !== 'teacher' && role !== 'admin') {
      channelClaim.setDisableSendAudio(true);
      channelClaim.setDisableSendVideo(true);
    }

    const token = fmLiveswitch.Token.generateClientRegisterToken(
      sails.config.fmLiveswitch.applicationId,
      'user-' + this.req.user.id,
      inputs.deviceId,
      inputs.clientId,
      [role],
      [channelClaim],
      sails.config.fmLiveswitch.sharedSecret,
    )


    const existingLivestreamClientInDb = await LivestreamClient.findOne({
      liveswitch_client_id: inputs.clientId
    });

    if (!existingLivestreamClientInDb) {
      const userAgent = this.req.headers['user-agent'];
      const parsedUserAgent = userAgentParser(userAgent);

      await LivestreamClient.create({
        client: this.req.client.id,
        'class': inputs.classId,
        user: this.req.user.id,
        liveswitch_client_id: inputs.clientId,
        role: role,
        user_agent: userAgent,
        user_agent_parsed: parsedUserAgent
      });
    }



    return exits.success({
      token: token,
    })

  },
}
