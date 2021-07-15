/**
 * VideoFilterVideoMainCategory.js
 */

module.exports = {

  tableName: 'video_filter_video_main_category',

  attributes: {

    video_filter_id: {
      model: 'VideoFilter',
    },

    video_main_category_id: {
      model: 'VideoMainCategory',
    },

  },

}

