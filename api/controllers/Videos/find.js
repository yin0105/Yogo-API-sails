const VideoObj = require('../../objection-models/Video');
const VALID_EAGER_POPULATE_FIELDS = [
  'video_groups',
  'video_filter_values',
  'video_tags',
  'teachers',
  'teachers.image',
  'related_videos',
  'video_main_categories',
];

const VALID_MANUAL_POPULATE_FIELDS_ADMIN = [
  'is_restricted_to_yogo',
];

const VALID_MANUAL_POPULATE_FIELDS_PUBLIC = [
  'has_public_access',
  'is_user_favorite'
];

module.exports = {
  friendlyName: 'Find videos',

  inputs: {
    id: {
      type: 'json',
      required: false,
      description: 'Id can be specified as ?id=x or using the endpoint /videos/:id',
    },
    populate: {
      type: 'json',
      required: false,
    },
    mainCategoryIds: {
      type: 'json',
    },
    filterValueIds: {
      type: 'json',
    },
    teacherIds: {
      type: 'json',
    },
    searchQuery: {
      type: 'string',
    },
  },

  exits: {
    forbidden: {
      responseType: 'forbidden',
    },
  },

  fn: async function (inputs, exits) {

    if (!(await sails.helpers.can2('controller.Videos.find', this.req))) {
      return exits.forbidden();
    }

    const updateVideoListNeeded = await sails.helpers.clientSettings.find(this.req.client.id, 'vimeo_update_video_list_needed');

    if (updateVideoListNeeded && this.req.authorizedRequestContext === 'admin') {
      await sails.helpers.video.updateAllVideoProviderData(this.req.client);
    }

    const videoQuery = VideoObj.query().alias('v')
      .where({
        'v.client': this.req.client.id,
        'v.archived': false,
      })
      .groupBy('v.id');
    if (inputs.id) {
      if (_.isArray(inputs.id)) {
        videoQuery.andWhere('v.id','in', inputs.id);
      } else {
        videoQuery.andWhere('v.id', inputs.id);
      }
    }

    const extendedVideoEnabled = this.req.client.extended_video_enabled;
    if (extendedVideoEnabled) {
      if (inputs.mainCategoryIds) {
        videoQuery.joinRelation('video_main_categories', {alias: 'vmc'})
          .andWhere('vmc.id', 'in', _.isArray(inputs.mainCategoryIds) ? inputs.mainCategoryIds : [inputs.mainCategoryIds])
          .andWhere({'vmc.archived': 0})
        ;
      }
      if (inputs.filterValueIds) {
        const activeFilterValues = await VideoFilterValue.find({id: inputs.filterValueIds, archived: 0});
        const activeFilterValuesByVideoFilterId = _.groupBy(activeFilterValues, 'video_filter_id');

        _.each(activeFilterValuesByVideoFilterId, (filterValues, filterId) => {
          const joinTableAlias = 'vfv_' + filterId;
          const joinTableObj = {};
          joinTableObj[joinTableAlias] = 'video_filter_value_video';
          videoQuery.innerJoin(joinTableObj, 'v.id', `${joinTableAlias}.video_id`)
            .andWhere(`${joinTableAlias}.video_filter_value_id`, 'in', _.map(filterValues, 'id'));
        });
      }
      if (inputs.teacherIds) {
        videoQuery.joinRelation('teachers', {alias: 'u'})
          .andWhere('u.id', 'in', _.isArray(inputs.teacherIds) ? inputs.teacherIds : [inputs.teacherIds])
          .andWhere({'u.archived': 0})
        ;
      }
      if (inputs.searchQuery) {
        videoQuery.leftJoinRelation('video_tags', {alias: 'vt'});
        videoQuery.leftJoinRelation('video_filter_values', {alias: 'vfv'});
        videoQuery.leftJoinRelation('teachers', {alias: 'video_teacher'});
        videoQuery.andWhere(qb => {
          qb.where(titleDescriptionQueryBuilder => {
            if (inputs.searchQuery.length === 1) {
              titleDescriptionQueryBuilder.andWhere('name_for_searching', 'like', inputs.searchQuery + '%');
            } else {
              const searchParts = inputs.searchQuery.split(' ').filter(s => s.length >= 1);
              titleDescriptionQueryBuilder.andWhere(function (builder) {
                builder.where(function (builder2) {
                  for (let i = 0; i < searchParts.length; i++) {
                    builder2.andWhere('name_for_searching', 'like', '%' + searchParts[i] + '%');
                  }
                })
                  .orWhereRaw("MATCH (name_for_searching, description_for_searching) AGAINST (? IN NATURAL LANGUAGE MODE)",
                    inputs.searchQuery);
              });
            }
          })
            .orWhere(tagQueryBuilder => {
              tagQueryBuilder.where('vt.client_id', this.req.client.id)
                .andWhere(tagNameQueryBuilder => {
                  tagNameQueryBuilder.where('vt.name', inputs.searchQuery)
                    .orWhere(tagNameBeginningQueryBuilder => {
                      tagNameBeginningQueryBuilder
                        .where(inputs.searchQuery.length, '>=', 3)
                        .andWhere('vt.name', 'like', inputs.searchQuery + '%');
                    });
                });
            })
            .orWhere(filterValueQuerybuilder => {
              filterValueQuerybuilder.where('vfv.client_id', this.req.client.id)
                .andWhere(filterValueNameQuerybuilder => {
                  filterValueNameQuerybuilder.where('vfv.name', inputs.searchQuery)
                    .orWhere(filterValueNameBeginningQueryBuilder => {
                      filterValueNameBeginningQueryBuilder
                        .where(inputs.searchQuery.length, '>=', 3)
                        .andWhere('vfv.name', 'like', inputs.searchQuery + '%');
                    });
                });
            })
            .orWhere(teacherQueryBuilder => {
              teacherQueryBuilder
                .where('video_teacher.client', this.req.client.id)
                .andWhere(teacherNameQueryBuilder => {
                  teacherNameQueryBuilder
                    .where('video_teacher.first_name', inputs.searchQuery)
                    .orWhere('video_teacher.last_name', inputs.searchQuery)
                    .orWhere(teacherFirstNameBeginningQueryBuilder => {
                      teacherFirstNameBeginningQueryBuilder
                        .where(inputs.searchQuery.length, '>=', 3)
                        .andWhere('video_teacher.first_name', 'like', inputs.searchQuery + '%');
                    });
                });
            })
          ;
        });

      }

    }

    if (inputs.populate) {
      const eagerPopulateFields = _.intersection(inputs.populate, VALID_EAGER_POPULATE_FIELDS);
      const eagerConfig = sails.helpers.populate.relationFieldListToEagerLoadConfigObject(eagerPopulateFields);
      videoQuery.eager(eagerConfig);
    }

    const yogoVideos = await videoQuery;

    if (inputs.populate) {
      const manualPopulateFields = _.intersection(inputs.populate, VALID_MANUAL_POPULATE_FIELDS_PUBLIC);

      if (this.req.authorizedRequestContext === 'admin') {
        const manualPopulateFieldsAdmin = _.intersection(inputs.populate, VALID_MANUAL_POPULATE_FIELDS_ADMIN);
        manualPopulateFields.push(...manualPopulateFieldsAdmin);
      }
      for (let i = 0; i < manualPopulateFields.length; i++) {
        const manualPopulateField = manualPopulateFields[i];
        const helper = require('../../helpers/populate/videos/' + _.kebabCase(manualPopulateField));
        const helperHasUserInput = !!helper.inputs.user;
        await sails.helpers.populate.videos[_.camelCase(manualPopulateField)].with({
          videos: yogoVideos,
          user: helperHasUserInput ? this.req.user : undefined,
        });
      }

    }

//await sails.helpers.populate.videos.videoProviderData(yogoVideos)
    await sails.helpers.video.setInformationLevelForUser(yogoVideos, this.req);

    return exits.success(inputs.id && !_.isArray(inputs.id) ? yogoVideos[0] : yogoVideos);

  },

}
;
