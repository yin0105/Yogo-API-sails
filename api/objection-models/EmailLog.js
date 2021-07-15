const {Model} = require('objection')
const knex = require('../services/knex')
Model.knex(knex)

class EmailLog extends Model {

  static get tableName () {
    return 'email_log'
  }

}

module.exports = EmailLog
