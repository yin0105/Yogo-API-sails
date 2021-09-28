const crypto = require('crypto');

module.exports = {
  friendlyName: 'Pay order with specific payment subscription',

  inputs: {
    order: {
      type: 'ref',
      required: true,
    },
    paymentSubscription: {
      type: 'ref',
      required: true,
    },
  },

  fn: async (inputs, exits) => {

    const cronLog = sails.helpers.cron.log;

    const orderId = sails.helpers.util.idOrObjectIdInteger(inputs.order);
    const order = await Order.findOne(orderId);

    console.log("inputs.paymentSubscription = ", inputs.paymentSubscription);
    const paymentSubscriptionId = sails.helpers.util.idOrObjectIdInteger(inputs.paymentSubscription);
    console.log("paymentSubscriptionId = ", paymentSubscriptionId)
    const paymentSubscription = await PaymentSubscription.findOne(paymentSubscriptionId);

    let paymentResult;

    console.log("order.total = =", order.total)
    if (order.total > 0) {

      const paymentServiceProvider = paymentSubscription.payment_service_provider;
      console.log("paymentServiceProvider = ", paymentServiceProvider)

      await cronLog('About to call fetchApiPayment for order ID ' + order.id + ' using PSP ' + paymentServiceProvider);
      console.log('About to call fetchApiPayment for order ID ' + order.id + ' using PSP ' + paymentServiceProvider);

      paymentResult = await sails.helpers.paymentProvider[paymentServiceProvider].fetchApiPayment(order, paymentSubscription);
      console.log("paymentResult = ", paymentResult)

      await cronLog('Result from fetchApiPayment for order ID ' + order.id + ': ' + paymentResult.success);

    } else {

      paymentResult = {
        success: true,
        payType: 'FREE',
        transactionId: 'FREE',
        maskedCard: '',
        cardExpiration: '',
      };

      await cronLog('Skipped fetchApiPayment because order ID ' + order.id + ' was a total of 0 kr');
    }

    if (paymentResult.success) {

      await Order.update({
        id: order.id,
      }, {
        paid: Date.now(),
        pay_type: paymentResult.payType,
        transaction_id: paymentResult.transactionId,
        card_prefix: paymentResult.maskedCard.substr(0, 6),
        card_last_4_digits: paymentResult.maskedCard.substr(12),
        card_expires: paymentResult.cardExpiration,
        masked_card: paymentResult.maskedCard,
        receipt_token: crypto.randomBytes(32).toString('hex'),
      });

      await sails.helpers.order.setInvoiceId(order.id);

    } else {
      await Order.update({
        id: order.id,
      }, {
        payment_failed: Date.now(),
      });
    }

    return exits.success(paymentResult);

  },
};
