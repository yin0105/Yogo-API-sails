const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID;
const assertAsyncThrows = require('../../../utils/assert-async-throws');
const comparePartialObject = require('../../../utils/compare-partial-object');

const fixtures = require('../../../fixtures/factory').fixtures;

const MockDate = require('mockdate');
const moment = require('moment');

describe('helpers.order.create-from-cart', async () => {

  beforeEach(async () => {
    await CartItem.destroy({});
  });

  it("should fail if there are no items in user's cart", async () => {

    const cartItems = await CartItem.createEach(
      [
        {
          item_type: 'membership_type',
          item_id: fixtures.membershipTypeYogaUnlimited.id,
          payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
          user: fixtures.userBill.id,
        },
        {
          item_type: 'event',
          item_id: fixtures.eventWithMultipleTimeSlots.id,
          user: fixtures.userBill.id,
        },
      ],
    ).fetch();

    await assertAsyncThrows(async () => {
        await sails.helpers.order.createFromCart.with({
          user: fixtures.userAlice,
        });
      },
      'noItemsInCart',
    );

    await CartItem.destroy({id: _.map(cartItems, 'id')});

  });

  it('should throw "membershipTypeArchived" and remove cart item', async () => {

    const cartItems = await CartItem.createEach([
      {
        item_type: 'membership_type',
        item_id: fixtures.membershipTypeYogaUnlimited.id,
        payment_option: 999999,
        user: fixtures.userAlice.id,
      },
      {
        item_type: 'class_pass_type',
        item_id: fixtures.classPassTypeDanceTenClasses.id,
        user: fixtures.userAlice.id,
      },
    ]).fetch();

    await MembershipType.update({id: fixtures.membershipTypeYogaUnlimited.id}, {archived: true});

    await assertAsyncThrows(
      async () => {
        await sails.helpers.order.createFromCart.with({
          user: fixtures.userAlice,
        });
      },
      'membershipTypeArchived',
    );

    const cartItemsRemaining = await CartItem.find();
    expect(cartItemsRemaining).to.matchPattern(`[
      {
        item_type: 'class_pass_type',
        item_id: ${fixtures.classPassTypeDanceTenClasses.id},
        user: ${fixtures.userAlice.id},
        ...
      }
    ]`);

    await MembershipType.update({id: fixtures.membershipTypeYogaUnlimited.id}, {archived: false});
    await CartItem.destroy({id: _.map(cartItems, 'id')});

  });

  it('should throw "classPassTypeArchived" and remove cart item', async () => {

    const cartItems = await CartItem.createEach([
      {
        item_type: 'class_pass_type',
        item_id: fixtures.classPassTypeYogaUnlimitedOneMonth.id,
        user: fixtures.userAlice.id,
      },
      {
        item_type: 'class_pass_type',
        item_id: fixtures.classPassTypeDanceTenClasses.id,
        user: fixtures.userAlice.id,
      },
    ]).fetch();


    await ClassPassType.update({id: fixtures.classPassTypeYogaUnlimitedOneMonth.id}, {archived: true});

    await assertAsyncThrows(
      async () => {
        await sails.helpers.order.createFromCart.with({
          user: fixtures.userAlice,
        });
      },
      'classPassTypeArchived',
    );

    const cartItemsRemaining = await CartItem.find();
    expect(cartItemsRemaining).to.matchPattern(`[
      {
        item_type: 'class_pass_type',
        item_id: ${fixtures.classPassTypeDanceTenClasses.id},
        user: ${fixtures.userAlice.id},
        ...
      }
    ]`);

    await ClassPassType.update({id: fixtures.classPassTypeYogaUnlimitedOneMonth.id}, {archived: false});
    await CartItem.destroy({id: _.map(cartItems, 'id')});

  });

  // it("should create an order from the user's cart", async () => {

  //   const cartItems = await CartItem.createEach(
  //     [
  //       {
  //         item_type: 'membership_type',
  //         item_id: fixtures.membershipTypeYogaUnlimited.id,
  //         payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
  //         user: fixtures.userAlice.id,
  //       },
  //       {
  //         item_type: 'event',
  //         item_id: fixtures.eventWithMultipleTimeSlots.id,
  //         user: fixtures.userAlice.id,
  //       },
  //       {
  //         item_type: 'class_pass_type',
  //         item_id: fixtures.classPassTypeDanceTenClasses.id,
  //         user: fixtures.userAlice.id,
  //       },
  //       {
  //         item_type: 'product',
  //         item_id: fixtures.productYogaMat.id,
  //         user: fixtures.userAlice.id,
  //       },
  //     ],
  //   ).fetch();

  //   const returnedOrder = await sails.helpers.order.createFromCart.with({
  //     user: fixtures.userAlice,
  //   });

  //   const expectedOrder = {
  //     client: testClientId,
  //     user: fixtures.userAlice.id,
  //     test: true,
  //   };

  //   comparePartialObject(
  //     returnedOrder,
  //     expectedOrder,
  //   );

  //   expectedOrder.order_items = [
  //     {
  //       item_type: 'membership_type',
  //       item_id: fixtures.membershipTypeYogaUnlimited.id,
  //       payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
  //       name: fixtures.membershipTypeYogaUnlimited.name + ' (Monthly)',
  //       count: 1,
  //       item_price: fixtures.yogaUnlimitedPaymentOptionMonthly.payment_amount,
  //       total_price: fixtures.yogaUnlimitedPaymentOptionMonthly.payment_amount,
  //     },
  //     {
  //       item_type: 'event',
  //       item_id: fixtures.eventWithMultipleTimeSlots.id,
  //     },
  //     {
  //       item_type: 'class_pass_type',
  //       item_id: fixtures.classPassTypeDanceTenClasses.id,
  //     },
  //     {
  //       item_type: 'product',
  //       item_id: fixtures.productYogaMat.id,
  //     },
  //   ];

  //   const createdOrder = await Order.findOne(returnedOrder.id).populate('order_items');

  //   comparePartialObject(
  //     createdOrder,
  //     expectedOrder,
  //   );

  //   await Order.destroy({id: createdOrder.id});
  //   await OrderItem.destroy({order: createdOrder.id});
  //   await CartItem.destroy({id: _.map(cartItems, 'id')});

  // });

  // it("should apply a discount code", async () => {

  //   const discountCode = await DiscountCode.create({
  //     name: 'halfprice',
  //     type: 'discount_percent',
  //     discount_percent: 50,
  //     valid_for_items: ['events', 'products'],
  //   }).fetch();

  //   const cartItems = await CartItem.createEach(
  //     [
  //       {
  //         item_type: 'membership_type',
  //         item_id: fixtures.membershipTypeYogaUnlimited.id,
  //         payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
  //         user: fixtures.userAlice.id,
  //       },
  //       {
  //         item_type: 'event',
  //         item_id: fixtures.eventWithMultipleTimeSlots.id,
  //         user: fixtures.userAlice.id,
  //       },
  //       {
  //         item_type: 'class_pass_type',
  //         item_id: fixtures.classPassTypeYogaTenClasses.id,
  //         user: fixtures.userAlice.id,
  //       },
  //       {
  //         item_type: 'product',
  //         item_id: fixtures.productYogaMat.id,
  //         user: fixtures.userAlice.id,
  //       },
  //       {
  //         item_type: 'discount_code',
  //         item_id: discountCode.id,
  //         user: fixtures.userAlice.id,
  //       },
  //     ],
  //   ).fetch();

  //   const returnedOrder = await sails.helpers.order.createFromCart.with({
  //     user: fixtures.userAlice,
  //   });

  //   const expectedTotal = fixtures.yogaUnlimitedPaymentOptionMonthly.payment_amount +
  //     fixtures.eventWithMultipleTimeSlots.price / 2 +
  //     fixtures.classPassTypeYogaTenClasses.price +
  //     fixtures.productYogaMat.price / 2;

  //   expect(returnedOrder).to.matchPattern(`{
  //     client: ${testClientId},
  //     user: ${fixtures.userAlice.id},
  //     test: true,
  //     total: ${expectedTotal},
  //     vat_amount: ${fixtures.productYogaMat.price * 0.2 / 2},
  //     ...
  //   }`);

  //   const createdOrder = await Order.findOne(returnedOrder.id).populate('order_items');

  //   expect(createdOrder).to.matchPattern(`{
  //     order_items: [
  //       {
  //         item_type: 'membership_type',
  //         item_id: ${fixtures.membershipTypeYogaUnlimited.id},
  //         payment_option: ${fixtures.yogaUnlimitedPaymentOptionMonthly.id},
  //         ...
  //       },
  //       {
  //         item_type: 'event',
  //         item_id: ${fixtures.eventWithMultipleTimeSlots.id},
  //         ...
  //       },
  //       {
  //         item_type: 'class_pass_type',
  //         item_id: ${fixtures.classPassTypeYogaTenClasses.id},
  //         ...
  //       },
  //       {
  //         item_type: 'product',
  //         item_id: ${fixtures.productYogaMat.id},
  //         ...
  //       },
  //       {
  //         item_type: 'discount_code',
  //         item_id: ${discountCode.id},
  //         count: 1,
  //         item_price: -2110,
  //         total_price: -2110,
  //         ...
  //       }
  //     ],
  //     client: ${testClientId},
  //     user: ${fixtures.userAlice.id},
  //     test: true,
  //     total: ${expectedTotal},
  //     vat_amount: ${fixtures.productYogaMat.price * 0.2 / 2},
  //     ...
  //   }`);

  //   await Order.destroy({id: createdOrder.id});
  //   await OrderItem.destroy({order: createdOrder.id});
  //   await CartItem.destroy({id: _.map(cartItems, 'id')});
  //   await DiscountCode.destroy({id: discountCode.id});

  // });

  it('should apply a membership campaign name', async () => {

    const membershipCampaign = await MembershipCampaign.create({
      client: testClientId,
      name: 'Test membership campaign, in create-from-cart',
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      number_of_months_at_reduced_price: 2,
      reduced_price: 50,
      min_number_of_months_since_customer_last_had_membership_type: 12,
    }).fetch();

    await MembershipType.update({id: fixtures.membershipTypeYogaUnlimited.id}, {active_campaign: membershipCampaign.id});

    const cartItems = await CartItem.createEach(
      [
        {
          item_type: 'membership_type',
          item_id: fixtures.membershipTypeYogaUnlimited.id,
          payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
          user: fixtures.userAlice.id,
          membership_campaign: membershipCampaign.id,
        },
      ],
    ).fetch();

    const returnedOrder = await sails.helpers.order.createFromCart.with({
      user: fixtures.userAlice,
    });

    const createdOrder = await Order.findOne(returnedOrder.id).populate('order_items');

    expect(createdOrder).to.matchPattern(`{
      order_items: [
        {
          name: 'Yoga Unlimited (Monthly) - Test membership campaign, in create-from-cart',
          item_type: 'membership_type',
          item_id: ${fixtures.membershipTypeYogaUnlimited.id},
          payment_option: ${fixtures.yogaUnlimitedPaymentOptionMonthly.id},
          item_price: ${membershipCampaign.reduced_price}
          ...
        },
      ],
      client: ${testClientId},
      user: ${fixtures.userAlice.id},
      test: true,
      total: ${membershipCampaign.reduced_price},
      vat_amount: 0,
      ...
    }`);

    await MembershipType.update({id: fixtures.membershipTypeYogaUnlimited.id}, {active_campaign: null});

    await Order.destroy({id: createdOrder.id});
    await OrderItem.destroy({order: createdOrder.id});
    await CartItem.destroy({id: _.map(cartItems, 'id')});
    await MembershipCampaign.destroy({id: membershipCampaign.id});

  });

  it('should throw "userIsNotEligibleForCampaign" if user had membership recently', async () => {

    const membershipCampaign = await MembershipCampaign.create({
      client: testClientId,
      name: 'Test membership campaign, in create-from-cart',
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      number_of_months_at_reduced_price: 2,
      reduced_price: 50,
      min_number_of_months_since_customer_last_had_membership_type: 12,
    }).fetch();

    await MembershipType.update({id: fixtures.membershipTypeYogaUnlimited.id}, {active_campaign: membershipCampaign.id});

    const cartItems = await CartItem.createEach(
      [
        {
          item_type: 'membership_type',
          item_id: fixtures.membershipTypeYogaUnlimited.id,
          payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
          user: fixtures.userAlice.id,
          membership_campaign: membershipCampaign.id,
        },
      ],
    ).fetch();

    const oldMembership = await Membership.create({
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'ended',
      archived: false,
      paid_until: '2020-01-15',
      user: fixtures.userAlice.id,
    }).fetch();

    MockDate.set(moment.tz('2020-03-20', 'Europe/Copenhagen'));

    await assertAsyncThrows(
      async () => {
        await sails.helpers.order.createFromCart.with({
          user: fixtures.userAlice,
        });
      },
      'userIsNotEligibleForCampaign',
    );


    await MembershipType.update({id: fixtures.membershipTypeYogaUnlimited.id}, {active_campaign: null});

    await Membership.destroy({id: oldMembership.id});
    await CartItem.destroy({id: _.map(cartItems, 'id')});
    await MembershipCampaign.destroy({id: membershipCampaign.id});

    MockDate.reset();

  });

  it('should throw "customerAlreadyHasMaxNumberOfClassPassType" if customer already has max number of a class pass type', async () => {

    const classPass = await ClassPass.create({
      class_pass_type: fixtures.classPassTypeYogaOneClassIntroOffer.id,
      classes_left: 0,
      client: testClientId,
      user: fixtures.userAlice.id,
    }).fetch();

    const cartItem = await CartItem.create({
      item_type: 'class_pass_type',
      item_id: fixtures.classPassTypeYogaOneClassIntroOffer.id,
      user: fixtures.userAlice.id,
    }).fetch();

    await assertAsyncThrows(async () => {
        await sails.helpers.order.createFromCart.with({
          user: fixtures.userAlice,
        });
      },
      'customerAlreadyHasMaxNumberOfClassPassType',
    );

    await ClassPass.destroy({id: classPass.id});
    await CartItem.destroy({id: cartItem.id});

  });

  it('should not throw "customerAlreadyHasMaxNumberOfClassPassType" if customer still can buy a number  of the class pass type', async () => {

    const classPass = await ClassPass.create({
      class_pass_type: fixtures.classPassTypeYogaOneClassIntroOfferThreePerCustomer.id,
      classes_left: 0,
      client: testClientId,
      user: fixtures.userAlice.id,
    }).fetch();

    const cartItem = await CartItem.create({
      item_type: 'class_pass_type',
      item_id: fixtures.classPassTypeYogaOneClassIntroOfferThreePerCustomer.id,
      user: fixtures.userAlice.id,
    }).fetch();

    const order = await sails.helpers.order.createFromCart.with({
      user: fixtures.userAlice,
    });

    const orderInDb = await Order.findOne(order.id).populate('order_items');

    expect(orderInDb.order_items[0]).to.matchPattern(`
      {
        item_type: 'class_pass_type',
        item_id: ${fixtures.classPassTypeYogaOneClassIntroOfferThreePerCustomer.id},
        ...
      }`,
    );

    await Order.destroy({id: orderInDb.id});
    await OrderItem.destroy({order: orderInDb.id});
    await ClassPass.destroy({id: classPass.id});
    await CartItem.destroy({id: cartItem.id});

  });

  it('should mark order as test, if config.productionPayments is not set', async () => {

    const cartItem = await CartItem.create({
      item_type: 'class_pass_type',
      item_id: fixtures.classPassTypeYogaTenClasses.id,
      user: fixtures.userAlice.id,
    }).fetch();

    const order = await sails.helpers.order.createFromCart.with({
      user: fixtures.userAlice,
    });

    expect(order).matchPattern(`
      {
        test: true,
        payment_provider_order_id: /^${order.id}_test\\d{13}$/,
        ...
      }`,
    );

    await Order.destroy({id: order.id});
    await OrderItem.destroy({order: order.id});
    await CartItem.destroy({id: cartItem.id});

  });

  it('should not mark order as test, if config.productionPayments is set', async () => {

    sails.config.productionPayments = true;

    const cartItem = await CartItem.create({
      item_type: 'class_pass_type',
      item_id: fixtures.classPassTypeYogaTenClasses.id,
      user: fixtures.userAlice.id,
    }).fetch();

    const order = await sails.helpers.order.createFromCart.with({
      user: fixtures.userAlice,
    });

    expect(order).matchPattern(`
      {
        test: false,
        payment_provider_order_id: '',
        ...
      }`,
    );

    await Order.destroy({id: order.id});
    await OrderItem.destroy({order: order.id});
    await CartItem.destroy({id: cartItem.id});

    delete sails.config.productionPayments;

  });

  it('should throw "paymentOptionGoneAway" if cart item payment option does not match membership type', async () => {

    const cartItem = await CartItem.create({
      item_type: 'membership_type',
      item_id: fixtures.membershipTypeYogaUnlimited.id,
      payment_option: 999999,
      user: fixtures.userAlice.id,
    }).fetch();

    await assertAsyncThrows(
      async () => {
        await sails.helpers.order.createFromCart.with({
          user: fixtures.userAlice,
        });
      },
      'paymentOptionGoneAway',
    );


    await CartItem.destroy({id: cartItem.id});

  });

});
