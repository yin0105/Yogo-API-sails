const {Model} = require('objection')
const knex = require('../services/knex')
Model.knex(knex)

class VideoFilterValue extends Model {

  static get tableName () {
    return 'video_filter_value'
  }

  static get relationMappings() {
    const Video = require('./Video')

    return {
      videos: {
        relation: Model.ManyToManyRelation,
        modelClass: Video,
        join: {
          from: 'video_filter_value.id',
          through: {
            from: 'video_filter_value_video.video_filter_value_id',
            to: 'video_filter_value_video.video_id',
          },
          to: 'video.id'
        }
      },
    }
  }

}

module.exports = VideoFilterValue
