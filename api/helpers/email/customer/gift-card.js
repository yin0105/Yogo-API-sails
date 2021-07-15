module.exports = {
  friendlyName: 'Send gift card to giver',

  inputs: {
    giftCard: {
      type: 'ref',
      required: true,
    },
  },

  fn: async (inputs, exits) => {

    const giftCardId = sails.helpers.util.idOrObjectIdInteger(inputs.giftCard);

    const giftCard = await GiftCard.findOne(giftCardId);

    const {
      gift_card_recipient_email_subject: subjectTemplate,
      gift_card_recipient_email_body: bodyTemplate,
    } = await sails.helpers.clientSettings.find(giftCard.client_id, [
      'gift_card_recipient_email_subject',
      'gift_card_recipient_email_body',
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
      },
      {
        studio: giftCard.client_id,
      },
    );

    await sails.helpers.email.send.with({
      non_user_email: giftCard.giver_email,
      client: giftCard.client_id,
      subject,
      text: body,
      emailType: 'gift_card',
    });

    return exits.success();

  },
};
