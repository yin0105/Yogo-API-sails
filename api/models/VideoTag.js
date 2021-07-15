/**
 * VideoTag.js
 */

module.exports = {

  tableName: 'video_tag',

  attributes: {

    client_id: {
      model: 'Client',
    },

    name: {
      type: 'string',
    },

    videos: {
      collection: 'Video',
      via: 'video_tag_id',
      through: 'VideoTagVideo'
    }

  },

};

