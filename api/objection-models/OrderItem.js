const {Model} = require('objection')
const knex = require('../services/knex')
Model.knex(knex)

class OrderItem extends Model {

  static get tableName() {
    return 'order_item'
  }

}

module.exports = OrderItem
