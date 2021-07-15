const {Model} = require('objection')
const knex = require('../services/knex')
Model.knex(knex)

class Order extends Model {

  static get tableName() {
    return 'order'
  }

  static get relationMappings() {

    const OrderItem = require('./OrderItem')

    return {
      order_items: {
        relation: Model.HasManyRelation,
        modelClass: OrderItem,
        join: {
          from: 'order.id',
          to: 'order_item.order',
        },
      },
    }
  }
}

module.exports = Order
