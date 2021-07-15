/**
 * PaymentSubscriptionTransaction.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

    tableName: 'payment_subscription_transaction',

    attributes: {

        client: {
            model: 'Client'
        },

        payment_subscription: {
            model: 'PaymentSubscription'
        },

        amount: {
            type: 'number'
        },

        status: {
            type:'string',
            isIn: ['pending', 'accepted', 'failed', 'error']
        },

        transaction_id: 'string',

        approvalcode: 'string',

        comment: {
          type: 'string',
          columnType: 'text',
        }

    }
};

