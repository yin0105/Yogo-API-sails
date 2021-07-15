const {Model} = require('objection')
const knex = require('../services/knex')
Model.knex(knex)

class Product extends Model {

  static get tableName () {
    return 'product'
  }

  static get relationMappings() {

    const Image = require('./Image')

    return {
      image: {
        relation: Model.BelongsToOneRelation,
        modelClass: Image,
        join: {
          from: 'product.image',
          to: 'image.id'
        }
      }
    }
  }

  $parseDatabaseJson(json) {
    // Remember to call the super class's implementation.
    json = super.$parseDatabaseJson(json);

    // Do your conversion here.
    if (typeof json.image !== 'undefined') {
      json.image_id = json.image
      delete json.image
    }

    return json;
  }

}

module.exports = Product
