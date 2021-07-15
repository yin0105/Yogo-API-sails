const {Model} = require('objection')
const knex = require('./knex-config')
Model.knex(knex)

const moment = require('moment')

class EventTimeSlot extends Model {

  static get tableName() {
    return 'event_time_slot'
  }

  static get relationMappings() {

    const Event = require('./Event')

    return {
      event: {
        relation: Model.BelongsToOneRelation,
        modelClass: Event,
        join: {
          from: 'event_time_slot.event',
          to: 'event.id'
        }
      }
    }

  }

  $parseDatabaseJson(json) {
    // Remember to call the super class's implementation.
    json = super.$parseDatabaseJson(json);

    if (typeof json.event !== 'undefined') {
      json.event_id = json.event
      delete json.event
    }

    if (typeof json.date !== 'undefined') {
      json.date = moment.tz(json.date, 'Europe/Copenhagen').format('YYYY-MM-DD')
    }

    if (typeof json.start_time !== 'undefined') {
      json.start_time = json.start_time.substr(0,5)
    }

    if (typeof json.end_time !== 'undefined') {
      json.end_time = json.end_time.substr(0,5)
    }

    return json
  }

  $formatDatabaseJson(json) {
    json = super.$formatDatabaseJson(json)

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
        event: {
          type: 'integer',
        },

      },
    }
  }

}

module.exports = EventTimeSlot
