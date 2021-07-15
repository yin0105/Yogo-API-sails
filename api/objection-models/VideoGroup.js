const {Model} = require('objection')
const knex = require('../services/knex')
Model.knex(knex)

class VideoGroup extends Model {

  static get tableName () {
    return 'video_group'
  }

  static get relationMappings() {
    const Video = require('./Video')

    return {
      videos: {
        relation: Model.ManyToManyRelation,
        modelClass: Video,
        join: {
          from: 'video_group.id',
          through: {
            from: 'video_video_groups__videogroup_videos.videogroup_videos',
            to: 'video_video_groups__videogroup_videos.video_video_groups',
          },
          to: 'video.id'
        }
      },
    }
  }

}

module.exports = VideoGroup
