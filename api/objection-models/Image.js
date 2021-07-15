const {Model} = require('objection')

const knex = require('../services/knex')

Model.knex(knex)

class Image extends Model {

  static get tableName () {
    return 'image'
  }

  static get virtualAttributes() {
    return ['url'];
  }

  url() {
    return sails.config.IMAGE_SERVER + '/[image_size]/' + this.filename
  }

}

module.exports = Image
