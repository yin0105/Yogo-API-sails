const {Model} = require('objection')
const knex = require('../services/knex')
Model.knex(knex)

class GiftCardLog extends Model {

  static get tableName () {
    return 'gift_card_log'
  }

}

module.exports = GiftCardLog;
