const {Model} = require('objection')
const knex = require('../services/knex')
Model.knex(knex)
const moment = require('moment-timezone')

class Class extends Model {

  static get tableName() {
    return 'class'
  }

  static get relationMappings() {
    const ClassType = require('./ClassType')
    const User = require('./User')
    const Room = require('./Room')
    const ClassSignup = require('./ClassSignup')
    const ClassWaitingListSignup = require('./ClassWaitingListSignup')
    const ClassLivestreamSignup = require('./ClassLivestreamSignup')
    const Client = require('./Client')
    const ClassEmail = require('./ClassEmail')
    const EmailLog = require('./EmailLog')

    return {
      class_type: {
        relation: Model.BelongsToOneRelation,
        modelClass: ClassType,
        join: {
          from: 'class.class_type',
          to: 'class_type.id',
        },
      },
      teachers: {
        relation: Model.ManyToManyRelation,
        modelClass: User,
        join: {
          from: 'class.id',
          through: {
            from: 'class_teachers__user_teaching_classes.class_teachers',
            to: 'class_teachers__user_teaching_classes.user_teaching_classes',
          },
          to: 'user.id',
        },
      },
      room: {
        relation: Model.BelongsToOneRelation,
        modelClass: Room,
        join: {
          from: 'class.room',
          to: 'room.id',
        },
      },
      signups: {
        relation: Model.HasManyRelation,
        modelClass: ClassSignup,
        join: {
          from: 'class.id',
          to: 'class_signup.class',
        },
      },
      livestream_signups: {
        relation: Model.HasManyRelation,
        modelClass: ClassLivestreamSignup,
        join: {
          from: 'class.id',
          to: 'class_livestream_signup.class',
        },
      },
      waiting_list_signups: {
        relation: Model.HasManyRelation,
        modelClass: ClassWaitingListSignup,
        join: {
          from: 'class.id',
          to: 'class_waiting_list_signup.class',
        },
      },
      class_emails: {
        relation: Model.HasManyRelation,
        modelClass: ClassEmail,
        join: {
          from: 'class.id',
          to: 'class_email.class_id',
        },
      },
      client: {
        relation: Model.BelongsToOneRelation,
        modelClass: Client,
        join: {
          from: 'class.client',
          to: 'client.id',
        }
      },
      sent_emails: {
        relation: Model.HasManyRelation,
        modelClass: EmailLog,
        join: {
          from: 'class.id',
          to: 'email_log.class_id',
        }
      }
    }
  }

  $parseDatabaseJson(json) {
    // Remember to call the super class's implementation.
    json = super.$parseDatabaseJson(json)

    // Do your conversion here.
    if (typeof json.room !== 'undefined') {
      json.room_id = json.room
      delete json.room
    }
    if (typeof json.class_type !== 'undefined') {
      json.class_type_id = json.class_type
      delete json.class_type
    }
    if (typeof json.client !== 'undefined') {
      json.client_id = json.client
      delete json.client
    }

    if (typeof json.date !== 'undefined') {
      json.date = moment(json.date).format('YYYY-MM-DD')
    }

    if (typeof json.start_time !== 'undefined') {
      json.start_time = json.start_time.substr(0, 5)
    }

    if (typeof json.end_time !== 'undefined') {
      json.end_time = json.end_time.substr(0, 5)
    }

    return json
  }

}

module.exports = Class
