/**
 * Video.js
 */

module.exports = {

  attributes: {

    client: {
      model: 'Client',
    },

    video_provider: {
      type: 'string',
      isIn: ['vimeo'],
    },

    video_provider_id: {
      type: 'string',
    },

    video_provider_data: {
      type: 'json',
    },

    video_groups: {
      collection: 'VideoGroup',
      via: 'videos',
    },

    video_filter_values: {
      collection: 'VideoFilterValue',
      via: 'video_id',
      through: 'VideoFilterValueVideo',
    },

    video_tags: {
      collection: 'VideoTag',
      via: 'video_id',
      through: 'VideoTagVideo',
    },

    video_main_categories: {
      collection: 'VideoMainCategory',
      via: 'video_id',
      through: 'VideoMainCategoryVideo',
    },

    teachers: {
      collection: 'User',
      via: 'video_id',
      through: 'VideoTeacher',
    },

    related_videos: {
      collection: 'Video',
      via: 'video_id',
      through: 'VideoRelatedVideo',
    },

    videos_this_is_related_to: {
      collection: 'Video',
      via: 'related_video_id',
      through: 'VideoRelatedVideo',
    },

    name_for_searching: {
      type: 'string',
      allowNull: true,
    },

    description_for_searching: {
      type: 'string',
      columnType: 'text',
      allowNull: true,
    },

    favorited_by_users: {
      collection: 'User',
      via: 'video_id',
      through: 'UserVideoFavorite',
    },

  },

};

