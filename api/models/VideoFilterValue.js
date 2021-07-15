/**
 * VideoFilterValue.js
 */

module.exports = {

  tableName: 'video_filter_value',

  attributes: {

    client_id: {
      model: 'Client',
    },

    name: {
      type: 'string',
    },

    video_filter_id: {
      model: 'VideoFilter'
    },

    videos: {
      collection: 'Video',
      via: 'video_filter_value_id',
      through: "VideoFilterValueVideo"
    },

    sort_idx: {
      type: 'number',
    },

  },

}

