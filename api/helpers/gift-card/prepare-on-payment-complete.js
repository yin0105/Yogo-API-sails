const moment = require('moment-timezone');

module.exports = {
  friendlyName: 'Prepare gift card when payment is complete',

  inputs: {
    giftCard: {
      type: 'ref',
      required: true,
    },
    order: {
      type: 'ref',
      required: true,
    },
  },

  fn: async (inputs, exits) => {

    const giftCardId = sails.helpers.util.idOrObjectIdInteger(inputs.giftCard);
    const giftCard = await GiftCard.findOne(giftCardId);

    const orderId = sails.helpers.util.idOrObjectIdInteger(inputs.order);

    let code,
      existingGiftCardWithSameCode,
      existingDiscountCodeWithSameCode;

    do {
      code = sails.helpers.string.randomCode(6);
      existingGiftCardWithSameCode = await GiftCard.findOne({
        client_id: giftCard.client_id,
        code: code,
      });
      existingDiscountCodeWithSameCode = await DiscountCode.findOne({
        client: giftCard.client_id,
        name: code,
      });
    } while (existingGiftCardWithSameCode || existingDiscountCodeWithSameCode);

    const {
      gift_card_delivery_mode: deliveryMode,
      gift_card_valid_for_days: validForDays,
      locale,
    }
      = await sails.helpers.clientSettings.find(giftCard.client_id, [
        'gift_card_delivery_mode',
        'gift_card_valid_for_days',
        'locale',
      ],
    );

    const updateData = {
      activated: true,
      paid_with_order_id: orderId,
      code,
      amount_left: giftCard.amount,
      valid_until: moment.tz('Europe/Copenhagen').add(validForDays, 'days').format('YYYY-MM-DD'),
    };

    if (deliveryMode === 'auto') {
      updateData.sent_by = 'system';
      updateData.sent_at = Date.now();
    }

    const [updatedGiftCard] = await GiftCard.update({id: giftCardId}, updateData).fetch();

    if (deliveryMode === 'auto') {
      await sails.helpers.email.customer.giftCard(updatedGiftCard);
    } else {
      await sails.helpers.email.admin.giftCardPurchaseNotification(updatedGiftCard, orderId);
    }

    await sails.helpers.giftCardLog.log(
      updatedGiftCard,
      sails.helpers.t('giftCardLog.GiftCardPurchasedWithAmount', [
        updatedGiftCard.amount_left + ' DKK',
        sails.helpers.util.formatDate(updatedGiftCard.valid_until, locale)
      ]),
    );

    return exits.success();

  },
};
