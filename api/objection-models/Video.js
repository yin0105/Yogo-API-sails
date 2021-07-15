const {Model} = require('objection');
const knex = require('../services/knex');
Model.knex(knex);

class Video extends Model {

  static get tableName() {
    return 'video';
  }

  static get relationMappings() {
    const Video = require('./Video');
    const VideoGroup = require('./VideoGroup');
    const VideoFilterValue = require('./VideoFilterValue');
    const VideoTag = require('./VideoTag');
    const VideoMainCategory = require('./VideoMainCategory');
    const User = require('./User');

    return {
      related_videos: {
        relation: Model.ManyToManyRelation,
        modelClass: Video,
        join: {
          from: 'video.id',
          through: {
            from: 'video_related_video.video_id',
            to: 'video_related_video.related_video_id',
          },
          to: 'video.id',
          modify: {'video.archived':0},
        },
      },
      video_groups: {
        relation: Model.ManyToManyRelation,
        modelClass: VideoGroup,
        join: {
          from: 'video.id',
          through: {
            from: 'video_video_groups__videogroup_videos.video_video_groups',
            to: 'video_video_groups__videogroup_videos.videogroup_videos',
          },
          to: 'video_group.id',
        },
        modify: {'video_group.archived':0},
      },
      video_filter_values: {
        relation: Model.ManyToManyRelation,
        modelClass: VideoFilterValue,
        join: {
          from: 'video.id',
          through: {
            from: 'video_filter_value_video.video_id',
            to: 'video_filter_value_video.video_filter_value_id',
          },
          to: 'video_filter_value.id',
        },
        modify: {'video_filter_value.archived':0},
      },
      video_tags: {
        relation: Model.ManyToManyRelation,
        modelClass: VideoTag,
        join: {
          from: 'video.id',
          through: {
            from: 'video_tag_video.video_id',
            to: 'video_tag_video.video_tag_id',
          },
          to: 'video_tag.id',
        },
        modify: {'video_tag.archived':0},
      },
      teachers: {
        relation: Model.ManyToManyRelation,
        modelClass: User,
        join: {
          from: 'video.id',
          through: {
            from: 'video_teacher.video_id',
            to: 'video_teacher.user_id',
          },
          to: 'user.id',
        },
        modify: {'user.archived':0, teacher: 1},
      },
      video_main_categories: {
        relation: Model.ManyToManyRelation,
        modelClass: VideoMainCategory,
        join: {
          from: 'video.id',
          through: {
            from: 'video_main_category_video.video_id',
            to: 'video_main_category_video.video_main_category_id',
          },
          to: 'video_main_category.id',
        },
        modify: {'video_main_category.archived':0},
      }

    };
  }

  $parseDatabaseJson(json) {
    json = super.$parseDatabaseJson(json);

    if (typeof json.video_provider_data !== 'undefined') {
      json.video_provider_data = JSON.parse(json.video_provider_data);
    }

    return json;
  }

}

module.exports = Video;
