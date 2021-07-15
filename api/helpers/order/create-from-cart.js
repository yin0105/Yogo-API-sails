module.exports = {

  friendlyName: 'Create order from cart',

  inputs: {
    user: {
      type: 'ref',
      required: true,
      description: 'The user to create the order for',
    },
  },

  exits: {
    membershipTypeArchived: {
      description: 'Membership type archived',
    },
    paymentOptionGoneAway: {
      description: 'Payment option gone away',
    },
    classPassTypeArchived: {
      description: 'Class pass type archived',
    },
    eventIsFullyBooked: {
      description: 'Event is fully booked',
    },
    userIsNotEligibleForCampaign: {
      description: 'Campaign is not for sale anymore, or user is not eligible',
    },
    customerAlreadyHasMaxNumberOfClassPassType: {
      description: 'Customer already has max number of class pass type',
    },
    noItemsInCart: {
      description: 'There are no items in the cart',
    },
  },

  fn: async (inputs, exits) => {

    const userId = sails.helpers.util.idOrObjectIdInteger(inputs.user);
    const user = await User.findOne(userId);

    // Find cartItems for building order
    let cartItems = await CartItem.find({user: userId});
    if (!cartItems.length) {
      throw 'noItemsInCart';
    }

    const useProductionPayments = sails.config.productionPayments;
    const testPayment = !useProductionPayments;


    // Create order
    let order = await Order.create({
      client: user.client,
      user: userId,
      test: testPayment,
    }).fetch();


    // Payment provider requires unique order id. Test environment often starts over from 1
    if (testPayment) {
      order = await Order.update({id: order.id}, {
        payment_provider_order_id: order.id + '_test' + Date.now(),
      }).fetch();

      order = order[0];

    }

    // Map cart items to order items
    let orderItems = _.map(cartItems, cartItem => {
      let orderItem = _.pick(cartItem, [
        'item_type',
        'item_id',
        'payment_option',
        'membership_campaign',
      ]);
      orderItem.order = order.id;
      orderItem.client = user.client;
      return orderItem;
    });


    let orderVatAmount = 0;
    let orderTotal = 0;

    // Fill out rest of the order item fields
    await Promise.all(_.map(orderItems, async orderItem => {
      switch (orderItem.item_type) {
        case 'membership_type':
          const membershipType = await MembershipType.findOne(orderItem.item_id).populate('payment_options', {for_sale: true}).populate('active_campaign');
          if (membershipType.archived) {
            await CartItem.destroy({
              user: userId,
              item_type: 'membership_type',
              item_id: orderItem.item_id,
            });
            throw 'membershipTypeArchived';
          }
          if (membershipType.active_campaign) {
            await sails.helpers.populate.membershipTypes.userIsEligibleForCampaign([membershipType], userId);
          }
          const selectedPaymentOption = _.find(membershipType.payment_options, payment_option => payment_option.id === orderItem.payment_option);
          if (!selectedPaymentOption) throw 'paymentOptionGoneAway';

          if (
            orderItem.membership_campaign &&
            (!membershipType.active_campaign ||
              membershipType.active_campaign.id != orderItem.membership_campaign ||
              !membershipType.userIsEligibleForCampaign)
          ) {
            throw 'userIsNotEligibleForCampaign';
          }
          orderItem.item_price = orderItem.membership_campaign ?
            membershipType.active_campaign.reduced_price :
            selectedPaymentOption.payment_amount;

          orderItem.name = membershipType.name;
          orderItem.name += ' (' + selectedPaymentOption.name + ')';
          if (orderItem.membership_campaign) {
            orderItem.name += ' - ' + membershipType.active_campaign.name;
          }
          orderItem.count = 1;
          orderItem.total_price = orderItem.item_price;
          orderTotal += orderItem.total_price;
          orderItem.vat_amount = 0;
          break;
        case 'class_pass_type':
          const classPassType = await ClassPassType.findOne(orderItem.item_id);
          if (classPassType.archived) {
            await CartItem.destroy({
              user: userId,
              item_type: 'class_pass_type',
              item_id: orderItem.item_id,
            });
            throw 'classPassTypeArchived';
          }
          if (classPassType.limited_number_per_customer) {
            const existingCustomerClassPasses = await ClassPass.find({
              user: userId,
              class_pass_type: orderItem.item_id,
              archived: false,
            });
            if (existingCustomerClassPasses.length >= classPassType.max_number_per_customer) {
              throw 'customerAlreadyHasMaxNumberOfClassPassType';
            }
          }
          orderItem.item_price = classPassType.price;
          orderItem.name = classPassType.name;
          orderItem.count = 1;
          orderItem.total_price = orderItem.item_price;
          orderTotal += orderItem.total_price;
          orderItem.vat_amount = 0;
          break;
        case 'event':
          const event = await Event.findOne(orderItem.item_id).populate('signups', {archived: 0});
          if (event.signups.length >= event.seats) {
            await CartItem.destroy({
              user: userId,
              item_type: 'event',
              item_id: orderItem.item_id,
            });
            throw 'eventIsFullyBooked';
          }
          orderItem.item_price = event.price;
          orderItem.name = event.name;
          orderItem.count = 1;
          orderItem.total_price = orderItem.item_price;
          orderTotal += orderItem.total_price;
          orderItem.vat_amount = 0;
          break;
        case 'product':
          const product = await Product.findOne(orderItem.item_id);
          orderItem.item_price = product.price;
          orderItem.name = product.name;
          orderItem.count = 1;
          orderItem.total_price = orderItem.item_price;
          orderTotal += orderItem.total_price;
          orderItem.vat_amount = orderItem.total_price * 0.2;
          orderVatAmount += orderItem.vat_amount;
          break;
        case 'discount_code':
          const discountCode = await DiscountCode.findOne(orderItem.item_id);
          const {price: discountCodePrice, vat: discountCodeVat, discountCodeAmounts} = await sails.helpers.cart.calculateDiscountCodeInCartPrice(cartItems);
          orderItem.item_price = discountCodePrice;
          orderItem.name = sails.helpers.t('discountCode.discountCode') + ': ' + discountCode.name;
          orderItem.count = 1;
          orderItem.total_price = orderItem.item_price;
          orderTotal += orderItem.total_price;
          orderItem.vat_amount = discountCodeVat;
          orderVatAmount += discountCodeVat;
          _.each(orderItems, (oI, oIIndex) => {
            oI.applied_discount_code_amount = discountCodeAmounts[oIIndex];
          });
          break;
      }
    }));

    const giftCardOrderItems = _.filter(orderItems, {item_type: 'gift_card_spend'});
    const giftCards = await GiftCard.find({id: _.map(giftCardOrderItems, 'item_id')});
    _.each(
      giftCardOrderItems,
      (giftCardOrderItem) => {
        giftCardOrderItem.product = _.find(giftCards, {id: giftCardOrderItem.item_id});
      },
    );
    const sortedGiftOrderItems = _.sortBy(giftCardOrderItems, 'product.valid_until');
    for (let i = 0; i < sortedGiftOrderItems.length; i++) {
      const orderItem = sortedGiftOrderItems[i];
      const amount = Math.min(orderTotal, orderItem.product.amount_left) * -1;
      orderItem.item_price = amount;
      orderItem.name = sails.helpers.t('global.GiftCard');
      orderItem.count = 1;
      orderItem.total_price = orderItem.item_price;
      orderItem.vat_amount = 0;
      orderTotal += amount;
    }


    await OrderItem.createEach(orderItems);

    order = await Order.findOne(order.id).populate('order_items');

    await Order.update({id: order.id}, {
      total: orderTotal,
      vat_amount: orderVatAmount,
    });

    order.total = orderTotal;
    order.vat_amount = orderVatAmount;


    return exits.success(order);

  },

};
