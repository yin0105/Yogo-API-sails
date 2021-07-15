const VIMEO_VIDEO_FIELDS = require('../../constants/VIMEO_VIDEO_FIELDS')

module.exports = {
  friendlyName: 'Lock video, so it can only be viewed through YOGO',

  inputs: {
    video: {
      type: 'ref',
      required: true,
    },
  },

  exits: {
    noAccessToken: {},
    accessDenied: {},
    noVimeoVideo: {},
  },


  fn: async (inputs, exits) => {

    const yogoVideo = await sails.helpers.util.objectFromObjectOrObjectId(inputs.video, Video)

    const clientId = sails.helpers.util.idOrObjectIdInteger(yogoVideo.client_id || yogoVideo.client)

    const {
      vimeo_oauth_access_token: accessToken,
      website_domain: clientWebsiteDomain,
    } = await sails.helpers.clientSettings.find(
      clientId,
      [
        'vimeo_oauth_access_token',
        'website_domain',
      ],
      true,
    )

    if (!accessToken) {
      throw 'noAccessToken'
    }

    const vimeoVideo = await sails.helpers.integrations.vimeo.api.request.with({
      method: 'GET',
      endpoint: '/videos/' + yogoVideo.video_provider_id + '?fields=' + VIMEO_VIDEO_FIELDS,
      accessToken: accessToken,
    })

    if (!vimeoVideo) {
      throw 'noVimeoVideo'
    }

    if (
      !_.includes(['disable', 'nobody'], vimeoVideo.privacy.view) ||
      vimeoVideo.privacy.embed != 'whitelist' ||
      vimeoVideo.embed.buttons.share ||
      vimeoVideo.embed.buttons.watchlater ||
      vimeoVideo.embed.buttons.like ||
      vimeoVideo.embed.buttons.embed ||
      vimeoVideo.embed.logos.vimeo
    ) {
      await sails.helpers.integrations.vimeo.api.request.with({
        method: 'PATCH',
        endpoint: vimeoVideo.uri,
        accessToken: accessToken,
        body: {
          privacy: {
            view: 'disable',
            embed: 'whitelist',
          },
          embed: {
            buttons: {
              share: false,
              watchlater: false,
              like: false,
              embed: false,
            },
            logos: {
              vimeo: false,
            },
          },
        },
      })
    }

    const videoDomainsWhitelist = (await sails.helpers.integrations.vimeo.api.request.with({
      method: 'GET',
      endpoint: vimeoVideo.uri + '/privacy/domains',
      accessToken: accessToken,
    })).data

    const clientYogoDomains = (await Domain.find({
      client: clientId,
      archived: false,
    })).map(row => row.name)

    const domainsToBeWhitelisted = _.concat(clientYogoDomains, clientWebsiteDomain)

    await Promise.all(_.map(domainsToBeWhitelisted, async domainToBeWhitelisted => {
        if (!_.find(videoDomainsWhitelist, {domain: domainToBeWhitelisted})) {
          await sails.helpers.integrations.vimeo.api.request.with({
            method: 'PUT',
            endpoint: vimeoVideo.uri + '/privacy/domains/' + encodeURIComponent(domainToBeWhitelisted),
            accessToken: accessToken,
          })
        }
      },
    ))

    await sails.helpers.video.updateVideoProviderData(clientId, yogoVideo, accessToken)

    return exits.success()

  },
}
