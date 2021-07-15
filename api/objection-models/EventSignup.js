const {Model} = require('objection')
const knex = require('./knex-config')
Model.knex(knex)

class EventSignup extends Model {

  static get tableName() {
    return 'event_signup'
  }

  static get relationMappings() {

    const User = require('./User')
    const Event = require('./Event')

    return {
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'event_signup.user',
          to: 'user.id'
        }
      },
      event: {
        relation: Model.BelongsToOneRelation,
        modelClass: Event,
        join: {
          from: 'event_signup.event',
          to: 'event.id'
        }
      }
    }

  }

  $parseDatabaseJson(json) {
    // Remember to call the super class's implementation.
    json = super.$parseDatabaseJson(json);

    if (typeof json.user !== 'undefined') {
      json.user_id = json.user
      delete json.user
    }

    if (typeof json.event !== 'undefined') {
      json.event_id = json.event
      delete json.event
    }

    return json
  }

  $formatDatabaseJson(json) {
    json = super.$formatDatabaseJson(json)

    if (typeof json.user_id !== 'undefined') {
      json.user = json.user_id
      delete json.user_id
    }

    if (typeof json.event_id !== 'undefined') {
      json.event = json.event_id
      delete json.event_id
    }

    return json

  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['client'],
      properties: {
        createdAt: {
          type: 'integer',
          default: 0
        },
        updatedAt: {
          type: 'integer',
          default: 0
        },
        client: {
          type: 'integer',
        },

        user: {
          type: 'integer',
        },

        event: {
          type: 'integer',
        },

      },
    }
  }

}

module.exports = EventSignup
