const {Model} = require('objection')
const knex = require('../services/knex')
Model.knex(knex)
const moment = require('moment-timezone')

class Client extends Model {

  static get tableName() {
    return 'client'
  }

}

module.exports = Client
