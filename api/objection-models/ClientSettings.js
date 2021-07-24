const {Model} = require('objection')
const knex = require('../services/knex')
Model.knex(knex)
const moment = require('moment-timezone')

class ClientSettings extends Model {

  static get tableName() {
    return 'client_settings'
  }

}

module.exports = ClientSettings