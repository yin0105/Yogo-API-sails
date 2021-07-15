module.exports = {
  friendlyName: 'Ticket auth',

  description: 'Pulls a payment from a previously created ticket',

  inputs: {
    order: {
      type: 'ref',
      description: 'The order that requires payment.',
      required: true,
    },
    paymentSubscription: {
      type: 'ref',
      description: 'The subscription to use for the payment',
      required: true,
    },
  },

  fn: async (inputs, exits) => {

    const cronLog = sails.helpers.cron.log


    const orderId = sails.helpers.util.idOrObjectIdInteger(inputs.order)
    const order = await Order.findOne(orderId).populate('order_items').populate('user').populate('client')

    const paymentSubscriptionId = sails.helpers.util.idOrObjectIdInteger(inputs.paymentSubscription)
    const paymentSubscription = await PaymentSubscription.findOne(paymentSubscriptionId)

    const dibsMerchant = order.client.dibs_merchant
    if (!dibsMerchant) throw new Error('No DIBS merchant available.')

    const paymentSubscriptionTransaction = await PaymentSubscriptionTransaction.create({
      amount: order.total,
      status: 'pending',
      client: order.client.id,
      payment_subscription: paymentSubscription.id,
    }).fetch()

    const orderText = order.user.first_name + ' ' + order.user.last_name +
      order.order_items.map(orderItem => '\n' + orderItem.name)

    const requestBody = {
      merchant: order.client.dibs_merchant,
      ticket: paymentSubscription.payment_provider_subscription_id,
      amount: order.total * 100,
      currency: '208',
      orderid: orderId,
      ordertext: orderText,
      textreply: 'true',
      test: !sails.config.productionPayments,
      capturenow: 'yes',
      // TODO: MD5 key
    }

    await cronLog('About to do Dibs API request with requestBody:' + JSON.stringify(requestBody))

    let response
    try {
      response = await sails.helpers.paymentProvider.dibs.apiRequest(requestBody)
    } catch (e) {

      await cronLog(e.message)

      await PaymentSubscriptionTransaction.update({id: paymentSubscriptionTransaction.id}, {
        status: 'error',
        comment: e.message,
      })

      throw e
    }

    await cronLog('Dibs API request response:' + JSON.stringify(response))

    const responseData = response

    if (responseData.status === 'ACCEPTED') {

      await PaymentSubscriptionTransaction.update({id: paymentSubscriptionTransaction.id}, {
        status: 'accepted',
        transaction_id: responseData.transact,
        approvalcode: responseData.approvalcode,
      })

      await cronLog('Dibs payment ACCEPTED for order ' + order.id)

      return exits.success({
        success: true,
        transactionId: responseData.transact,
        payType: responseData.cardtype,
        cardExpiration: '',
        maskedCard: '',
      })

    } else {

      await PaymentSubscriptionTransaction.update({id: paymentSubscriptionTransaction.id}, {
        status: 'failed',
        comment: responseData.reason,
      })

      await cronLog('Dibs payment FAILED for order ' + order.id + ' for reason: ' + responseData.reason)

      return exits.success({
        success: false,
      })

    }
  },
}
