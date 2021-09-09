module.exports = {
  friendlyName: 'Webhook for all events from Stripe',

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
    webhookError: {
      responseType: 'badRequest',
      description: 'The webhook error.',
    },
  },

  fn: async (inputs, exits) => {
    const secretKey = sails.config.paymentProviders.stripe.secretKey
    const endpointSecret = sails.config.paymentProviders.stripe.endpointSecret
    const stripe = require("stripe")(secretKey);
    const sig = this.req.headers['stripe-signature'];
    let event;

    // Verify webhook signature and extract the event.
    // See https://stripe.com/docs/webhooks/signatures for more information.
    try {
      event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
    } catch (err) {
      // return response.status(400).send(`Webhook Error: ${err.message}`);
      return exits.webhookError(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const connectedAccountId = event.account;
      const charges = paymentIntent.charges;
      if (charges && charges.length > 0){        
        await sails.helpers.paymentProvider.stripe.invoice.processIfPaid(charges[charges.length - 1]);
      }
      console.log('Connected account ID: ' + connectedAccountId);
      console.log(JSON.stringify(paymentIntent));
    }

    // response.json({received: true});
    return exits.success();





    // const cronLog = sails.helpers.cron.log;

    // await cronLog('Stripe webhook received. Data: ' + JSON.stringify(inputs));

    // if (!_.includes(['invoice_settled', 'invoice_authorized'], inputs.event_type)) {
    //   return exits.success();
    // }

    // const order = await Order.findOne({
    //   id: inputs.invoice,
    // });

    // if (!order) {
    //   return exits.invoiceNotFound('Invoice ID ' + inputs.invoice + ' is invalid');
    // }

    // if (order.user) {
    //   if (parseInt(inputs.customer) !== parseInt(order.user)) {
    //     return exits.customerDoesNotMatchInvoice(`Customer ID ${inputs.customer} dose not match invoice id ${inputs.invoice}`);
    //   }
    // } else if (order.non_user_email) {
    //   if (order.non_user_email !== inputs.customer) {
    //     return exits.customerDoesNotMatchInvoice(`Customer ID ${inputs.customer} dose not match invoice id ${inputs.invoice}`);
    //   }
    // } else {
    //   // Just in case
    //   return exits.customerDoesNotMatchInvoice(`Customer ID ${inputs.customer} dose not match invoice id ${inputs.invoice}`);
    // }

    // const clientId = order.client;
    // await cronLog('Webhook client: ' + clientId, clientId);

    // const expectedSignature = await sails.helpers.paymentProvider.stripe.webhook.calculateSignature.with({
    //   client: clientId,
    //   timestamp: inputs.timestamp,
    //   id: inputs.id,
    // });

    // if (expectedSignature !== inputs.signature) {
    //   await cronLog('Webhook signature invalid. ', clientId);
    //   return exits.signatureInvalid('The provided webhook signature does not match expected signature');
    // }

    // await cronLog('Webhook signature validated.', clientId);


    // if (_.includes(['invoice_settled', 'invoice_authorized'], inputs.event_type)) {
    //   await cronLog('Running process-invoice-if-paid from webhook.', clientId);
    //   await sails.helpers.paymentProvider.stripe.invoice.processIfPaid(inputs.invoice);
    // }

    // return exits.success();

  },
};
