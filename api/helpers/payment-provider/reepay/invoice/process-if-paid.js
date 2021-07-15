module.exports = {
  friendlyName: 'Process order if Reepay invoice has been paid',

  inputs: {
    invoiceId: {
      type: 'string',
      required: true,
    },
  },

  fn: async (inputs, exits) => {

    const cronLog = sails.helpers.cron.log

    await cronLog('Process invoice if paid. InvoiceID: ' + inputs.invoiceId)

    let order
    if (inputs.invoiceId.indexOf('_test') > -1) {
      order = await Order.findOne({payment_provider_order_id: inputs.invoiceId})
    } else {
      order = await Order.findOne(inputs.invoiceId)
    }


    const clientId = order.client

    const rpCharge = await sails.helpers.paymentProvider.reepay.api.request(
      clientId,
      'GET',
      '/charge/' + inputs.invoiceId,
    )
    await cronLog('rpCharge:' + JSON.stringify(rpCharge))

    if (!_.includes(['settled', 'authorized'], rpCharge.state)) {
      await cronLog(`Invoice with ID ${inputs.invoiceId} is not settled. Returning from "Process-if-paid"`)
      return exits.success()
    }

    await sails.helpers.order.processPaymentSettled.with({
      order: order.id,
      transaction_id: rpCharge.transaction,
      transaction_fee: 0,
      pay_type: rpCharge.source.card_type,
      card_prefix: rpCharge.source.masked_card.substr(0, 6),
      card_last_4_digits: rpCharge.source.masked_card.substr(12, 4),
      card_expiration: rpCharge.source.exp_date.replace('-', '/'),
      gateway_statuscode: rpCharge.source.acquirer_code,
      payment_service_provider: 'reepay',
      payment_provider_subscription_id: rpCharge.recurring_payment_method,
    })

    return exits.success()

  },
}
