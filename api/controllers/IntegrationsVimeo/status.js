const VideoObj = require('../../objection-models/Video');
const crypto = require('crypto');
const EAGER_POPULATE_FIELDS = [
  'video_groups',
  'video_filter_values',
  'video_tags',
  'teachers',
  'related_videos',
];

const MANUAL_POPULATE_FIELDS = [
  'is_restricted_to_yogo',
];

module.exports = {
  friendlyName: 'Get Vimeo integration status',

  inputs: {
    populate: {
      type: 'json',
      required: false,
    },
    update_from_video_provider: {
      type: 'boolean',
      defaultsTo: false,
    },
  },

  fn: async function (inputs, exits) {

    const clientId = this.req.client.id;
    const accessToken = await sails.helpers.clientSettings.find(clientId, 'vimeo_oauth_access_token', true);
    const oauthCsrfState = crypto.randomBytes(24).toString('hex');
    await sails.helpers.clientSettings.update(clientId, {
      vimeo_oauth_csrf_state: oauthCsrfState,
    });

    const response = {
      oauthCsrfState: clientId + '_' + oauthCsrfState,
      vimeoClientId: sails.config.integrations.vimeo.clientId,
    };

    if (!accessToken) {
      response.status = 'not_connected';
      return exits.success(response);
    }

    response.user = await sails.helpers.integrations.vimeo.getCurrentUser(clientId, accessToken)
      .tolerate('unauthorized', () => {
        return null;
      });

    if (!response.user) {
      response.status = 'not_connected';
      return exits.success(response);
    }

    const updateVideoListNeeded = await sails.helpers.clientSettings.find(clientId, 'vimeo_update_video_list_needed');

    if (inputs.update_from_video_provider || updateVideoListNeeded) {
      await sails.helpers.video.updateAllVideoProviderData(clientId, accessToken);
    }

    const videoQuery = VideoObj.query().where({
      client: clientId,
      archived: false,
    });
    if (inputs.populate) {
      const eagerPopulateFields = _.intersection(inputs.populate, EAGER_POPULATE_FIELDS);
      const eagerConfig = sails.helpers.populate.relationFieldListToEagerLoadConfigObject(eagerPopulateFields);
      videoQuery.eager(eagerConfig);
    }

    const yogoVideos = await videoQuery;

    // ENABLE THIS CHECK AFTER A WHILE, WHEN EVERYBODY PROBABLY HAS THE NEW ADMIN VERSION
    //if (inputs.populate && _.includes(inputs.populate, 'is_restricted_to_yogo')) {
      await sails.helpers.populate.videos.isRestrictedToYogo(yogoVideos);
    //}

    response.videos = yogoVideos;
    response.status = 'connected';
    return exits.success(response);

  },
};
