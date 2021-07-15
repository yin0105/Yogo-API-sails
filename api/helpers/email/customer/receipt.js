module.exports = {

  friendlyName: 'Customer email receipt',

  inputs: {
    order: {
      type: 'ref',
      required: true,
    },
  },

  fn: async (inputs, exits) => {

    await sails.helpers.cron.log('sendReceipt');

    const orderId = sails.helpers.util.idOrObjectIdInteger(inputs.order);

    const order = await Order.findOne(orderId)
      .populate('client')
      .populate('user');

    let {
      email_receipt_subject: subjectTemplate,
      email_receipt_body: bodyTemplate,
      email_bcc_to_client_on_receipt: bccToClient,
    } = await sails.helpers.clientSettings.find(order.client, [
      'email_receipt_subject',
      'email_receipt_body',
      'email_bcc_to_client_on_receipt',
    ]);

    const [subject, body] = await sails.helpers.string.fillInVariables(
      [subjectTemplate, bodyTemplate],
      {},
      {
        customer: order.user
          || {
            first_name: order.non_user_email,
            email: order.non_user_email,
            client: order.client,
          },
        studio: order.client,
      },
    );

    const {filename, pdfBuffer} = await sails.helpers.order.pdfReceipt(order);

    const attachments = [
      {
        filename: filename,
        content: pdfBuffer,
      },
    ];

    await sails.helpers.email.send.with({
      user: order.user,
      non_user_email: order.non_user_email,
      client: order.client,
      subject: subject,
      text: body,
      attachments: attachments,
      blindCopyToClient: bccToClient,
      emailType: 'receipt',
    });

    return exits.success();

  },

};
