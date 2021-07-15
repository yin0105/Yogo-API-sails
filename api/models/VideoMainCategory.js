/**
 * VideoMainCategory.js
 */

module.exports = {

  tableName: 'video_main_category',

  attributes: {

    client_id: {
      model: 'Client',
    },

    name: {
      type: 'string',
    },

    sort_idx: {
      type: 'number',
    },

    videos: {
      collection: 'Video',
      via: 'video_main_category_id',
      through: 'VideoMainCategoryVideo'
    },

    video_filters_specific_to_this_main_category: {
      collection: 'VideoFilter',
      via: 'video_main_category_id',
      through: 'VideoFilterVideoMainCategory',
    },

  },

}

