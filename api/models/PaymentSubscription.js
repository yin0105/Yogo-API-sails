module.exports = {

  tableName: 'payment_subscription',

  attributes: {

    client: {
      model: 'Client',
    },

    membership: {
      model: 'Membership',
    },

    payment_service_provider: {
      type: 'string',
      isIn: ['dibs', 'reepay', 'reepay_onboarding', 'stripe', 'stripe_onboarding'],
    },

    payment_provider_subscription_id: {
      type: 'string',
    },

    status: {
      type: 'string',
      isIn: ['active', 'stopped'],
    },

    pay_type: 'string',

    card_last_4_digits: 'string',

    card_expiration: 'string',

    card_nomask: 'string',

    card_prefix: 'string',

    customer_notified_of_error: {
      type: 'Boolean',
      defaultsTo: false,
    },

    orders: {
      collection: 'Order',
      via: 'payment_subscription',
    },

    payment_subscription_transactions: {
      collection: 'PaymentSubscriptionTransaction',
      via: 'payment_subscription',
    },


  },
}

