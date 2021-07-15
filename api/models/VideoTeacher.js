/**
 * VideoTeacher.js
 */

module.exports = {

  tableName: 'video_teacher',

  attributes: {

    video_id: {
      model: 'Video',
    },

    user_id: {
      model: 'User'
    }

  },

}

