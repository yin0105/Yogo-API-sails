/**
 * VideoMainCategoryVideo.js
 */

module.exports = {

  tableName: 'video_main_category_video',

  attributes: {

    video_main_category_id: {
      model: 'VideoMainCategory',
    },

    video_id: {
      model: 'Video',
    },

  },

};

