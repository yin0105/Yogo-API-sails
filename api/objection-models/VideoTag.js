const {Model} = require('objection');
const knex = require('../services/knex');
Model.knex(knex);

class VideoTag extends Model {

  static get tableName() {
    return 'video_tag';
  }

}

module.exports = VideoTag;
