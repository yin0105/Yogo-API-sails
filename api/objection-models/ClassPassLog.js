const {Model} = require('objection')
const knex = require('../services/knex')
Model.knex(knex)

class ClassPassLog extends Model {

  static get tableName () {
    return 'class_pass_log'
  }

  static get relationMappings() {
    const User = require('./User')

    return {
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'class_pass_log.user_id',
          to: 'user.id',
        },
      },
    }

  }

}

module.exports = ClassPassLog;
