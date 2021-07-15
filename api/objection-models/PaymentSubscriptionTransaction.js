const {Model} = require('objection')
const knex = require('./knex-config')
Model.knex(knex)

class PaymentSubscriptionTransaction extends Model {

  static get tableName() {
    return 'payment_subscription_transaction'
  }

}

module.exports = PaymentSubscriptionTransaction
