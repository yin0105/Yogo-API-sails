const {Model} = require('objection')
const knex = require('./knex-config')
Model.knex(knex)

class PaymentSubscription extends Model {

  static get tableName() {
    return 'payment_subscription'
  }

  static get relationMappings() {
    const PaymentSubscriptionTransaction = require('./PaymentSubscriptionTransaction');

    return {
      payment_subscription_transactions: {
        relation: Model.HasManyRelation,
        modelClass: PaymentSubscriptionTransaction,
        join: {
          from: 'payment_subscription.id',
          to: 'payment_subscription_transaction.payment_subscription',
        },
      },
    }
  }

}

module.exports = PaymentSubscription
