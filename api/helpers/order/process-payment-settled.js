const crypto = require('crypto')

module.exports = {
  friendlyName: 'Process order for payment settled',

  inputs: {
    order: {
      type: 'ref',
      required: true,
    },
    transaction_id: {
      type: 'string',
      defaultsTo: '',
    },
    transaction_fee: {
      type: 'number',
      defaultsTo: 0,
    },
    pay_type: {
      type: 'string',
      defaultsTo: '',
    },
    card_prefix: {
      type: 'string',
      defaultsTo: '',
      custom: ce => ce.match(/^(\d\d\d\d\d\d)|$/),
    },
    card_last_4_digits: {
      type: 'string',
      defaultsTo: '',
      custom: ce => ce.match(/^(\d\d\d\d)|$/),
    },
    card_expiration: {
      type: 'string',
      defaultsTo: '',
      custom: ce => ce.match(/^(\d\d\/\d\d)|$/),
    },
    gateway_statuscode: {
      type: 'string',
      defaultsTo: '',
    },
    payment_service_provider: {
      type: 'string',
      isIn: ['dibs', 'reepay'],
    },
    payment_provider_subscription_id: {
      type: 'string',
    },
  },

  fn: async (inputs, exits) => {

    const doProcessOrder = await sails.helpers.order.startProcessingIfNotAlreadyStarted(inputs.order, 'paid')

    if (!doProcessOrder) return exits.success()

    const orderId = sails.helpers.util.idOrObjectIdInteger(inputs.order)

    const orderPaymentDetails = _.pick(
      inputs,
      [
        'transaction_id',
        'transaction_fee',
        'pay_type',
        'card_prefix',
        'card_last_4_digits',
        'card_expiration',
        'gateway_statuscode',
        'payment_service_provider',
      ],
    )

    orderPaymentDetails.masked_card = inputs.card_prefix + 'XXXXXX' + inputs.card_last_4_digits

    await Order.update(
      {id: orderId},
      orderPaymentDetails,
    );

    // Assign invoice id before applying items, because some items (gift cards) need the invoice id.
    await sails.helpers.order.setInvoiceId(orderId);

    await sails.helpers.order.applyItemsToCustomer.with({
      order: orderId,
      paymentMethod: {
        payment_service_provider: inputs.payment_service_provider,
        payment_provider_subscription_id: inputs.payment_provider_subscription_id,
        pay_type: inputs.pay_type,
        card_prefix: inputs.card_prefix,
        card_last_4_digits: inputs.card_last_4_digits,
        card_expiration: inputs.card_expiration
      },
    });

    await Order.update({id: orderId}, {
      system_updated: Date.now(),
      receipt_token: crypto.randomBytes(32).toString('hex'),
    })

    await sails.helpers.order.removeOrderItemsFromCart(orderId)

    await sails.helpers.email.customer.receipt(orderId)

    await Order.update({id: orderId}, {
      receipt_sent: Date.now(),
    })

    return exits.success()

  },
}
