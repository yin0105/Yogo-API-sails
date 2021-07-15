module.exports = {
  friendlyName: 'Webhook for all events from Reepay',

  inputs: {
    "id": {
      type: "string",
    },
    "timestamp": {
      type: "string",
    },
    "signature": {
      type: "string",
    },
    "invoice": {
      type: "string",
    },
    "customer": {
      type: "string",
    },
    "transaction": {
      type: "string",
    },
    "event_type": {
      type: "string",
    },
    "event_id": {
      type: "string",
    },
  },

  exits: {
    invoiceNotFound: {
      responseType: 'badRequest',
      description: 'The specified invoice does not exist in Yogo DB',
    },
    customerNotFound: {
      responseType: 'badRequest',
      description: 'The specified customer does not exist in Yogo DB',
    },
    customerDoesNotMatchInvoice: {
      responseType: 'badRequest',
    },
    signatureInvalid: {
      responseType: 'badRequest',
      description: 'The webhook signature does not match the expected webhook signature.',
    },
  },

  fn: async (inputs, exits) => {

    const cronLog = sails.helpers.cron.log;

    await cronLog('Reepay webhook received. Data: ' + JSON.stringify(inputs));

    if (!_.includes(['invoice_settled', 'invoice_authorized'], inputs.event_type)) {
      return exits.success();
    }

    const order = await Order.findOne({
      id: inputs.invoice,
    });

    if (!order) {
      return exits.invoiceNotFound('Invoice ID ' + inputs.invoice + ' is invalid');
    }

    if (order.user) {
      if (parseInt(inputs.customer) !== parseInt(order.user)) {
        return exits.customerDoesNotMatchInvoice(`Customer ID ${inputs.customer} dose not match invoice id ${inputs.invoice}`);
      }
    } else if (order.non_user_email) {
      if (order.non_user_email !== inputs.customer) {
        return exits.customerDoesNotMatchInvoice(`Customer ID ${inputs.customer} dose not match invoice id ${inputs.invoice}`);
      }
    } else {
      // Just in case
      return exits.customerDoesNotMatchInvoice(`Customer ID ${inputs.customer} dose not match invoice id ${inputs.invoice}`);
    }

    const clientId = order.client;
    await cronLog('Webhook client: ' + clientId, clientId);

    const expectedSignature = await sails.helpers.paymentProvider.reepay.webhook.calculateSignature.with({
      client: clientId,
      timestamp: inputs.timestamp,
      id: inputs.id,
    });

    if (expectedSignature !== inputs.signature) {
      await cronLog('Webhook signature invalid. ', clientId);
      return exits.signatureInvalid('The provided webhook signature does not match expected signature');
    }

    await cronLog('Webhook signature validated.', clientId);


    if (_.includes(['invoice_settled', 'invoice_authorized'], inputs.event_type)) {
      await cronLog('Running process-invoice-if-paid from webhook.', clientId);
      await sails.helpers.paymentProvider.reepay.invoice.processIfPaid(inputs.invoice);
    }

    return exits.success();

  },
};
