/**
 * VideoFilterValueVideo.js
 */

module.exports = {

  tableName: 'video_filter_value_video',

  attributes: {

    video_filter_value_id: {
      model: 'VideoFilterValue',
    },

    video_id: {
      model: 'Video',
    },

  },

}

