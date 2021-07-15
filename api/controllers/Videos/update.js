module.exports = {
  friendlyName: 'Update video',

  inputs: {
    name: {
      type: 'string',
    },
    description: {
      type: 'string',
    },
    video_tags: {
      type: 'json',
    },
    video_filter_values: {
      type: 'json',
    },
    teachers: {
      type: 'json',
    },
    video_groups: {
      type: 'json',
    },
    related_videos: {
      type: 'json',
    },
    video_main_categories: {
      type: 'json',
    },
  },

  exits: {
    forbidden: {
      responseType: 'forbidden',
    },
  },

  fn: async function (inputs, exits) {

    if (!(await sails.helpers.can2('controller.Videos.update', this.req))) {
      return exits.forbidden();
    }

    const videoId = this.req.param('id');

    const yogoVideo = await Video.findOne(videoId);

    const accessToken = await sails.helpers.clientSettings.find(this.req.client.id, 'vimeo_oauth_access_token', true);

    if (!accessToken) {
      return exits.success('E_NO_ACCESS_TOKEN');
    }

    await sails.helpers.video.restrictVimeoVideoToYogo(yogoVideo);

    //console.log(yogoVideo);

    if (inputs.name || inputs.description) {
      const updateData = _.pick(inputs, ['name', 'description']);
      await sails.helpers.integrations.vimeo.api.request.with({
        method: 'PATCH',
        endpoint: yogoVideo.video_provider_data.uri,
        accessToken: accessToken,
        body: updateData,
      });
      await sails.helpers.video.updateVideoProviderData.with({
        video: videoId,
        accessToken,
        client: yogoVideo.client,
      });
      await Video.update({id: videoId}, {
        name_for_searching: updateData.name || '',
        description_for_searching: updateData.description || '',
      });
    }

    if (inputs.video_groups) {
      let videoGroupIds = inputs.video_groups;
      const validVideoGroups = await knex('video_group')
        .where('id', 'in', videoGroupIds)
        .andWhere({
          client: this.req.client.id,
          archived: 0,
        });

      await Video.replaceCollection(videoId, 'video_groups', _.map(validVideoGroups, 'id'));
    }

    if (inputs.video_main_categories) {
      let mainCategoryIds = inputs.video_main_categories;
      const validMainCategories = await knex('video_main_category')
        .where('id', 'in', mainCategoryIds)
        .andWhere({
          client_id: this.req.client.id,
          archived: 0,
        });

      await Video.replaceCollection(videoId, 'video_main_categories', _.map(validMainCategories, 'id'));
    }

    if (inputs.video_filter_values) {
      let videoFilterValueIds = inputs.video_filter_values;
      const validVideoFilterValues = await knex('video_filter_value')
        .where('id', 'in', videoFilterValueIds)
        .andWhere({
          client_id: this.req.client.id,
          archived: 0,
        });

      await Video.replaceCollection(videoId, 'video_filter_values', _.map(validVideoFilterValues, 'id'));
    }

    if (inputs.teachers) {
      let teacherIds = inputs.teachers;
      const validTeachers = await knex('user')
        .where('id', 'in', teacherIds)
        .andWhere({
          teacher: 1,
          client: this.req.client.id,
          archived: 0,
        });

      await Video.replaceCollection(videoId, 'teachers', _.map(validTeachers, 'id'));
    }

    if (inputs.video_tags) {
      const tagNames = inputs.video_tags;
      let existingTags = await knex('video_tag')
        .where('name', 'in', tagNames)
        .andWhere({
          client_id: this.req.client.id,
          archived: 0,
        });

      const nonExistingTagNames = _.differenceBy(
        tagNames,
        _.map(existingTags, 'name'),
      );

      const newTags = await VideoTag.createEach(_.map(nonExistingTagNames, tagName => ({
        name: tagName,
        client_id: this.req.client.id,
      }))).fetch();

      const allTagIds = _.concat(
        _.map(existingTags, 'id'),
        _.map(newTags, 'id'),
      );

      await Video.replaceCollection(videoId, 'video_tags', allTagIds);
    }

    if (inputs.related_videos) {
      let relatedVideoIds = inputs.related_videos;
      const validRelatedVideos = await knex('video')
        .where('id', 'in', relatedVideoIds)
        .andWhere({
          client: this.req.client.id,
          archived: 0,
        });

      // Couldn't get the following to work with Waterline or Objection convenience methods.
      await knex.transaction(async (trx) => {

        await trx('video_related_video')
          .where({video_id: videoId})
          .del();

        if (validRelatedVideos.length) {
          await trx('video_related_video')
            .insert(_.map(validRelatedVideos, relatedVideo => ({
              createdAt: Date.now(),
              updatedAt: Date.now(),
              archived: 0,
              client_id: this.req.client.id,
              video_id: videoId,
              related_video_id: relatedVideo.id,
            })));
        }

      });

    }

    return exits.success();

  },

};
