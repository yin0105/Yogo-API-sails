module.exports = {
  friendlyName: 'Update video provider data for all videos',

  inputs: {
    client: {
      type: 'ref',
      required: true,
    },
    accessToken: {
      type: 'string',
      required: false,
    },
  },

  exits: {
    noAccessToVimeo: {},
    unauthorized: {},
  },

  fn: async (inputs, exits) => {

    const logger = sails.helpers.logger('update-video-data-from-vimeo');

    const accessToken = inputs.accessToken ? inputs.accessToken : await sails.helpers.clientSettings.find(inputs.client, 'vimeo_oauth_access_token', true);

    if (!accessToken) throw 'noAccessToVimeo';

    const vimeoVideos = await sails.helpers.integrations.vimeo.getVideosUploadedByCurrentUser(inputs.client, accessToken)
      .tolerate('unauthorized', e => {
        exits.unauthorized(e.message);
        return null;
      });

    if (!vimeoVideos) return;

    _.forEach(vimeoVideos, vimeoVideo => {
      vimeoVideo.id = /\d{5,}/.exec(vimeoVideo.uri)[0];
    });

    logger.info('Vimeo ids: ' + _.map(vimeoVideos, 'id').join(','));

    const clientId = sails.helpers.util.idOrObjectIdInteger(inputs.client);
    const yogoVideos = await Video.find({client: clientId, archived: false});

    const yogoVideosMissingInVimeo = _.differenceWith(
      yogoVideos,
      vimeoVideos,
      (yogoVideo, vimeoVideo) => {
        return yogoVideo.video_provider_id === vimeoVideo.id;
      },
    );

    logger.info('yogoVideosMissingInVimeo: ' + _.map(yogoVideosMissingInVimeo, 'id').join(','));

    if (yogoVideosMissingInVimeo.length) {
      await Video.update({id: _.map(yogoVideosMissingInVimeo, 'id')}, {archived: true});
    }

    const yogoVideosAlsoInVimeo = _.intersectionWith(
      yogoVideos,
      vimeoVideos,
      (yogoVideo, vimeoVideo) => {
        return yogoVideo.video_provider_id === vimeoVideo.id;
      },
    );

    for (let i = 0; i < yogoVideosAlsoInVimeo.length; i++) {
      const yogoVideoToUpdate = yogoVideosAlsoInVimeo[i];
      const vimeoVideo = _.find(vimeoVideos, {id: yogoVideoToUpdate.video_provider_id});
      await Video.update({id: yogoVideoToUpdate.id}, {
        video_provider_data: vimeoVideo,
        name_for_searching: vimeoVideo.name || '',
        description_for_searching: vimeoVideo.description || '',
      });
    }

    let vimeoVideosMissingInYogo = _.differenceWith(
      vimeoVideos,
      yogoVideos,
      (vimeoVideo, yogoVideo) => {
        return yogoVideo.video_provider_id === vimeoVideo.id;
      },
    );

    logger.info('vimeoVideosMissingInYogo: ' + _.map(vimeoVideosMissingInYogo, 'id').join(','));

    const yogoVideosArchivedButExistInVimeo = await knex({v: 'video'})
      .where({
        archived: 1,
      })
      .andWhere('video_provider_id', 'in', _.map(vimeoVideosMissingInYogo, 'id'));

    if (yogoVideosArchivedButExistInVimeo.length) {

      logger.info('yogoVideosArchivedButExistInVimeo: ' + _.map(yogoVideosArchivedButExistInVimeo, 'id'));

      for (let i = 0; i < vimeoVideosMissingInYogo.length; i++) {
        const vimeoVideoMissingInYogo = vimeoVideosMissingInYogo[i];
        const vimeoId = vimeoVideoMissingInYogo.id;
        const existingArchivedYogoVideos = _.filter(
          yogoVideosArchivedButExistInVimeo,
          {video_provider_id: vimeoId},
        );
        if (existingArchivedYogoVideos.length) {
          const latestArchivedYogoVideo = _.sortBy(
            existingArchivedYogoVideos,
            'createdAt',
          ).pop();

          logger.info('Vimeo id ' + vimeoId + ' exists as archived YOGO id ' + latestArchivedYogoVideo.id);
          await Video.update({id: latestArchivedYogoVideo.id}, {
            archived: false,
            video_provider_data: vimeoVideoMissingInYogo,
            name_for_searching: vimeoVideoMissingInYogo.name || '',
            description_for_searching: vimeoVideoMissingInYogo.description || '',
          });
          yogoVideos.push(latestArchivedYogoVideo)
        }

      }
      vimeoVideosMissingInYogo = _.differenceWith(
        vimeoVideos,
        yogoVideos,
        (vimeoVideo, yogoVideo) => {
          return yogoVideo.video_provider_id === vimeoVideo.id;
        },
      );
      logger.info('Vimeo videos still missing in YOGO: ' + _.map(vimeoVideosMissingInYogo, 'id').join(','));
    }


    await Video.createEach(
      _.map(
        vimeoVideosMissingInYogo,
        missingVideo => ({
          client: clientId,
          video_provider: 'vimeo',
          video_provider_id: missingVideo.id,
          video_provider_data: missingVideo,
          name_for_searching: missingVideo.name || '',
          description_for_searching: missingVideo.description || '',
        }),
      ),
    );

    await sails.helpers.clientSettings.update(clientId, {
      vimeo_update_video_list_needed: false,
    });

    return exits.success();

  },
};
