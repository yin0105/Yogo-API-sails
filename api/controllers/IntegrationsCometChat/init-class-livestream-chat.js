const CometChatApi = require('../../services/CometChatApi');

module.exports = {
  friendlyName: 'Init class livestream chat',

  description: 'Set up CometChat so user exists, class group exists and user is member of group',

  inputs: {
    class: {
      type: 'number',
      required: true,
    },
  },

  exits: {
    forbidden: {
      responseType: 'forbidden',
    },
    classNotFound: {
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {

    if (!await sails.helpers.can2('controller.IntegrationsCometChat.init-class-livestream-chat', this.req)) {
      return exits.forbidden();
    }

    const classId = inputs.class;
    const uid = `user-${this.req.user.id}`;
    const guid = `class-${classId}`;
    let authToken;

    const classObj = await Class.findOne({
      id: classId,
      client: this.req.client.id,
      archived: false,
      livestream_enabled: true,
    });
    if (!classObj) {
      return exits.classNotFound('Class not found');
    }


    const cometChatUser = await CometChatApi.get(`/users/${uid}`, {
      validateStatus: function (status) {
        return status === 200 || status === 404;
      }}
    );
    if (cometChatUser) {
      const authTokens = await CometChatApi.get(`/users/${uid}/auth_tokens`);
      if (authTokens.length) {
        [authToken] = authTokens;
      } else {
        ({authToken} = await CometChatApi.post(`/users/${uid}/auth_tokens`));
      }
    } else {
      ({authToken} = await CometChatApi.post(
        `/users`,
        {
          uid: uid,
          name: this.req.user.first_name,
          avatar: this.req.user.image
            ? await sails.helpers.images.url(this.req.user.image, 200, 200, 'crop')
            : undefined,
          withAuthToken: true,
        },
      ));
    }


    const cometChatGroup = await CometChatApi.get(`/groups/${guid}`, {
      validateStatus: function (status) {
        return status === 200 || status === 404;
      }
    });

    if (!cometChatGroup) {
      await CometChatApi.post(
        `/groups`,
        {
          guid,
          type: 'private',
          name: `Class ${classId}`,
        },
      );
    }

    let groupMembers = {};
    if (_.includes(['admin', 'teacher'], this.req.authorizedRequestContext)) {
      groupMembers.admins = [uid];
    } else {
      groupMembers.participants = [uid];
    }
    await CometChatApi.post(`/groups/${guid}/members`, groupMembers);

    return exits.success({
      authToken,
      appId: sails.config.integrations.cometChat.appId,
      region: sails.config.integrations.cometChat.region,
      chatEnabled: sails.config.integrations.cometChat.livestreamChatEnabled,
    });
  },
};
