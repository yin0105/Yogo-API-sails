const {Model} = require('objection')
const knex = require('../services/knex')
Model.knex(knex)

class DiscountCode extends Model {

  static get tableName() {
    return 'discount_code'
  }

}

module.exports = DiscountCode
