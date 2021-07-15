module.exports = {
  friendlyName: 'Processes an invoice if it has been paid. Returns no indication about if it has actually processed it.',

  inputs: {
    invoiceId: {
      type: 'string',
      required: true,
    },
  },

  fn: async function (inputs, exits) {

    await sails.helpers.paymentProvider.reepay.invoice.processIfPaid(inputs.invoiceId)

    return exits.success()

  },
}
