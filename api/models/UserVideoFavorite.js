/**
 * UserVideoFavorite.js
 *
 * @description :: This is a join table for the many-to-many relation between ClassType and ClassPassType, specifically for livestream.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  tableName: 'user_video_favorite',

  attributes: {

    user_id: {
      model: 'User',
    },

    video_id: {
      model: 'Video',
    },

  },

}

