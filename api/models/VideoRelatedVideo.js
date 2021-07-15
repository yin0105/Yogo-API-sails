/**
 * VideoRelatedVideo.js
 */

module.exports = {

  tableName: 'video_related_video',

  attributes: {

    client_id: {
      model: 'Client'
    },

    video_id: {
      model: 'Video',
    },

    related_video_id: {
      model: 'Video',
    }

  },

}

