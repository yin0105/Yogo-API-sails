/**
 * VideoTagVideo.js
 *
 * @description :: This is a join table for the many-to-many relation between ClassType and ClassPassType, specifically for livestream.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  tableName: 'video_tag_video',

  attributes: {

    video_tag_id: {
      model: 'VideoTag',
    },

    video_id: {
      model: 'Video',
    },

  },

}

