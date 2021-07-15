const {Model} = require('objection')
const knex = require('./knex-config')
Model.knex(knex)

class EventGroup extends Model {

  static get tableName () {
    return 'event_group'
  }

  static get relationMappings() {
    const Image = require('./Image')

    return {
      image: {
        relation: Model.HasOneRelation,
        modelClass: Image,
        join: {
          from: 'event_group.image',
          to: 'image.id'
        }
      },
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

module.exports = EventGroup
