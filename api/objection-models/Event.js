const {Model} = require('objection')
const knex = require('./knex-config')
Model.knex(knex)
const moment = require('moment-timezone')

class Event extends Model {

  static get tableName () {
    return 'event'
  }

  static get relationMappings() {
    const EventGroup = require('./EventGroup')
    const User = require('./User')
    const Room = require('./Room')
    const EventSignup = require('./EventSignup')
    const Image = require('./Image')

    return {
      event_group: {
        relation: Model.BelongsToOneRelation,
        modelClass: EventGroup,
        join: {
          from: 'event.event_group',
          to: 'event_group.id'
        }
      },
      teachers: {
        relation: Model.ManyToManyRelation,
        modelClass: User,
        join: {
          from: 'event.id',
          through: {
            from: 'event_teachers__user_teaching_events.event_teachers',
            to: 'event_teachers__user_teaching_events.user_teaching_events',
          },
          to: 'user.id'
        }
      },
      room: {
        relation: Model.BelongsToOneRelation,
        modelClass: Room,
        join: {
          from: 'event.room',
          to: 'room.id'
        }
      },
      signups: {
        relation: Model.HasManyRelation,
        modelClass: EventSignup,
        join: {
          from: 'event.id',
          to: 'event_signup.event'
        }
      },
      image: {
        relation: Model.BelongsToOneRelation,
        modelClass: Image,
        join: {
          from: 'event.image',
          to: 'image.id'
        }
      },
    }
  }

  $parseDatabaseJson(json) {
    // Remember to call the super class's implementation.
    json = super.$parseDatabaseJson(json);

    // Do your conversion here.
    if (typeof json.room !== 'undefined') {
      json.room_id = json.room
      delete json.room
    }
    if (typeof json.event_group !== 'undefined') {
      json.event_group_id = json.event_group
      delete json.event_group
    }

    if (typeof json.image !== 'undefined') {
      json.image_id = json.image
      delete json.image
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

    return json;
  }

}

module.exports = Event
