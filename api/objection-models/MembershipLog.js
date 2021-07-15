const {Model} = require('objection')
const knex = require('./knex-config')
Model.knex(knex)

class MembershipLog extends Model {

  static get tableName() {
    return 'membership_log'
  }

  static get relationMappings() {
    const User = require('./User')

    return {
      userRelation: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'membership_log.user',
          to: 'user.id',
        },
      },
    }

  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['client', 'user', 'membership', 'entry'],
      properties: {
        createdAt: {
          type: 'integer',
          default: 0,
        },
        updatedAt: {
          type: 'integer',
          default: 0,
        },
        client: {
          type: 'integer',
        },
        user: {
          type: 'integer',
        },

        membership: {
          type: 'integer',
        },

        entry: {
          type: 'string',
        },

      },
    }
  }

}

module.exports = MembershipLog
