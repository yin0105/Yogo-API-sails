const {Model} = require('objection')
const knex = require('../services/knex')
Model.knex(knex)

class VideoMainCategory extends Model {

  static get tableName () {
    return 'video_main_category'
  }

  static get relationMappings() {
    const Video = require('./Video')

    return {
      videos: {
        relation: Model.ManyToManyRelation,
        modelClass: Video,
        join: {
          from: 'video_main_category.id',
          through: {
            from: 'video_main_category_video.video_main_category_id',
            to: 'video_main_category_video.video_id',
          },
          to: 'video.id'
        }
      },
    }
  }

}

module.exports = VideoMainCategory
