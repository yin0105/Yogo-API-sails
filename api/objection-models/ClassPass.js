const {Model} = require('objection')
const knex = require('../services/knex')
Model.knex(knex)
const moment = require('moment-timezone');

class ClassPass extends Model {

  static get tableName() {
    return 'class_pass'
  }

  static get relationMappings() {
    const ClassPassType = require('./ClassPassType');
    const User = require('./User');
    const ClassPassLog = require('./ClassPassLog')

    return {
      class_pass_type: {
        relation: Model.BelongsToOneRelation,
        modelClass: ClassPassType,
        join: {
          from: 'class_pass.class_pass_type',
          to: 'class_pass_type.id',
        },
      },
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'class_pass.user',
          to: 'user.id'
        }
      },
      log_entries: {
        relation: Model.HasManyRelation,
        modelClass: ClassPassLog,
        join: {
          from: 'class_pass.id',
          to: 'class_pass_log.class_pass_id'
        }
      }
    }

  }

  $parseDatabaseJson(json) {
    json = super.$parseDatabaseJson(json)

    if (typeof json.class_pass_type !== 'undefined') {
      json.class_pass_type_id = json.class_pass_type
      delete json.class_pass_type
    }

    if (typeof json.user !== 'undefined') {
      json.user_id = json.user
      delete json.user
    }

    if (typeof json.start_date !== 'undefined') {
      json.start_date = moment(json.start_date).format('YYYY-MM-DD')
    }

    if (typeof json.valid_until !== 'undefined') {
      json.valid_until = moment(json.valid_until).format('YYYY-MM-DD')
    }

    return json
  }

  $formatDatabaseJson(json) {
    json = super.$formatDatabaseJson(json)

    if (typeof json.class_pass_type_id !== 'undefined') {
      json.class_pass_type = json.class_pass_type_id
      delete json.class_pass_type_id
    }

    if (typeof json.user_id !== 'undefined') {
      json.user = json.user_id
      delete json.user_id
    }

    return json

  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['client', 'classes_left', 'start_date', 'valid_until'],
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

        /*order: {
          type: 'integer',
          default: null,
        },*/

        class_pass_type: {
          type: 'integer'
        },

        classes_left: {
          type: 'integer',
        },

        start_date: {
          type: 'date',
        },

        valid_until: {
          type: 'date',
        },
      },
    }
  }

}

module.exports = ClassPass
