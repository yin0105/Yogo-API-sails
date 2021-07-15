module.exports = {

  friendlyName: 'Update video data from Vimeo',

  fn: async function (inputs, exits) {

    const logger = sails.helpers.logger('update-video-data-from-vimeo')

    const clients = await Client.find({})

    for (let i = 0; i < clients.length; i++) {
      const client = clients[i]
      const accessToken = await sails.helpers.clientSettings.find(client, 'vimeo_oauth_access_token', true)
      if (!accessToken) {
        logger.info(`Client ${client.id}: --- has no Vimeo access token ---`)
        continue
      }
      logger.info(`Client ${client.id}: Fetching videos from Vimeo.`)
      const response = await sails.helpers.video.updateAllVideoProviderData(client, accessToken)
        .tolerate('unauthorized', e => {
          logger.info(`Client ${client.id}: ****** Access to Vimeo failed ******.`)
          return e
        })
      if (!(response instanceof Error)) {
        logger.info(`Client ${client.id}: DONE fetching videos from Vimeo.`)
      }
    }

    return exits.success()

  },
}
