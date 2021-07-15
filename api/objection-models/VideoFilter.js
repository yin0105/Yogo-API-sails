const {Model} = require('objection');
const knex = require('../services/knex');
Model.knex(knex);

class VideoFilter extends Model {

  static get tableName() {
    return 'video_filter';
  }

  static get relationMappings() {
    const VideoFilterValue = require('./VideoFilterValue');
    const VideoMainCategory = require('./VideoMainCategory');

    return {
      filter_values: {
        relation: Model.HasManyRelation,
        modelClass: VideoFilterValue,
        join: {
          from: 'video_filter.id',
          to: 'video_filter_value.video_filter_id',
        },
        filter: q => q.orderBy('video_filter_value.sort_idx'),
      },
      show_for_main_categories: {
        relation: Model.ManyToManyRelation,
        modelClass: VideoMainCategory,
        join: {
          from: 'video_filter.id',
          through: {
            from: 'video_filter_video_main_category.video_filter_id',
            to: 'video_filter_video_main_category.video_main_category_id',
          },
          to: 'video_main_category.id',
        },
        filter: q => q.where('video_main_category.archived', 0),
      },
    };
  }

  $parseDatabaseJson(json) {
    // Remember to call the super class's implementation.
    json = super.$parseDatabaseJson(json);

    // Do your conversion here.
    if (typeof json.show_in_more_filters !== 'undefined') {
      json.show_in_more_filters = !!json.show_in_more_filters;
    }

    if (typeof json.show_only_for_specific_main_categories !== 'undefined') {
      json.show_only_for_specific_main_categories = !!json.show_only_for_specific_main_categories;
    }

    return json;
  }

}

module.exports = VideoFilter;
