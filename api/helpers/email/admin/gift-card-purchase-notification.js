module.exports = {
  friendlyName: 'Send notification of gift card purchase to admin',

  inputs: {
    giftCard: {
      type: 'ref',
      required: true,
    },
    order: {
      type: 'ref',
      required: true
    }
  },

  fn: async (inputs, exits) => {

    const giftCardId = sails.helpers.util.idOrObjectIdInteger(inputs.giftCard);

    const giftCard = await GiftCard.findOne(giftCardId);

    const orderId = sails.helpers.util.idOrObjectIdInteger(inputs.order);

    const order = await Order.findOne(orderId);
    console.log('Order: ', order);

    const {
      gift_card_manual_delivery_admin_notification_email: adminEmail,
      gift_card_manual_delivery_admin_notification_subject: subjectTemplate,
      gift_card_manual_delivery_admin_notification_body: bodyTemplate,
      locale
    } = await sails.helpers.clientSettings.find(giftCard.client_id, [
      'gift_card_manual_delivery_admin_notification_email',
      'gift_card_manual_delivery_admin_notification_subject',
      'gift_card_manual_delivery_admin_notification_body',
      'locale'
    ]);

    const [subject, body] = await sails.helpers.string.fillInVariables(
      [subjectTemplate, bodyTemplate],
      {
        giver_email: giftCard.giver_email,
        giver_name: giftCard.giver_name,
        recipient_email: giftCard.recipient_email,
        recipient_name: giftCard.recipient_name,
        code: giftCard.code,
        message: giftCard.message,
        amount: `${giftCard.amount} DKK`,
        gift_card_created: sails.helpers.util.formatDate(giftCard.createdAt, locale) + ' ' + sails.helpers.util.normalizeDate(giftCard.createdAt).format('HH:mm'),
        invoice_id: order.invoice_id,
      },
      {
        studio: giftCard.client_id,
      },
    );


    await sails.helpers.email.send.with({
      non_user_email: adminEmail || (await Client.findOne(giftCard.client_id)).email,
      client: giftCard.client_id,
      subject,
      text: body,
      emailType: 'gift_card_purchase_admin_notification',
    });

    return exits.success();

  },
};
