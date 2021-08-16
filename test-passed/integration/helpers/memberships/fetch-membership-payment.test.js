const sinon = require('sinon');
const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID;
const fixtures = require('../../../fixtures/factory').fixtures;
const assert = require('assert');
const comparePartialObject = require('../../../utils/compare-partial-object');

const assertAsyncThrows = require('../../../utils/assert-async-throws');

const dibsApiRequestFakeFactory = require('../../../fakes/default-api-request-fake');
const emailSendFakeFactory = require('../../../fakes/email-send-fake-factory');

const moment = require('moment-timezone');

describe('helpers.memberships.fetch-membership-payment', async () => {

  let
    emailSendFake,
    apiRequestFake,
    pdfReceiptFake,
    membership;


  before(async () => {

    membership = await Membership.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
    }).fetch();

  });

  beforeEach(async () => {
    emailSendFake = emailSendFakeFactory.installEmailSendFake();

    pdfReceiptFake = sinon.fake.returns(Buffer.from('Test'));
    sinon.replace(sails.helpers.order, 'pdfReceipt', pdfReceiptFake);
  });

  afterEach(async () => {
    await Order.destroy({});
    await OrderItem.destroy({});
    await PaymentSubscriptionTransaction.destroy({});

    sinon.restore();
  });

  after(async () => {

  });

  it('should fetch a payment and update system accordingly', async () => {

    const paymentSubscription = await PaymentSubscription.create({
      membership: membership.id,
      payment_provider_subscription_id: 'ppsi_123456',
      status: 'active',
      payment_service_provider: 'dibs',
    }).fetch();

    await Membership.update({id: membership.id}, {
      paid_until: '2019-05-15',
      renewal_failed: 0,
      renewal_failed_last_time: 0,
    });

    apiRequestFake = dibsApiRequestFakeFactory.replace();

    const timestampBeforeRunnningTest = moment().format('x');

    ////////////////////
    await sails.helpers.memberships.fetchMembershipPayment(membership);
    ////////////////////


    const updatedMembership = await Membership.findOne({id: membership.id});

    comparePartialObject(
      updatedMembership,
      {
        paid_until: new Date(moment.tz('2019-06-15', 'Europe/Copenhagen')),
        renewal_failed: 0,
        renewal_failed_last_time_at: 0,
      },
    );

    const updatedPaymentSubscription = await PaymentSubscription.findOne(paymentSubscription.id);

    comparePartialObject(
      updatedPaymentSubscription,
      {
        membership: membership.id,
        status: 'active',
      },
    );

    const createdPaymentSubscriptionTransactions = await PaymentSubscriptionTransaction.find({
      payment_subscription: paymentSubscription.id,
    });

    comparePartialObject(
      createdPaymentSubscriptionTransactions,
      [
        {
          payment_subscription: paymentSubscription.id,
          status: 'accepted',
          amount: fixtures.yogaUnlimitedPaymentOptionMonthly.payment_amount,
        },
      ],
    );


    const createdOrders = await Order.find({membership: membership.id});

    comparePartialObject(
      createdOrders,
      [
        {
          membership: membership.id,
          test: 1,
          user: fixtures.userAlice.id,
          total: fixtures.yogaUnlimitedPaymentOptionMonthly.payment_amount,
          client: testClientId,
          payment_subscription: paymentSubscription.id,
          transaction_id: '123456',
          pay_type: 'V-DK',
          payment_service_provider: 'dibs',
        },
      ],
    );
    assert(createdOrders[0].paid > timestampBeforeRunnningTest);
    assert(createdOrders[0].paid < createdOrders[0].system_updated);
    assert(createdOrders[0].system_updated < moment().format('x'));

    const createdOrderItems = await OrderItem.find({order: createdOrders[0].id});

    const orderItemName = fixtures.membershipTypeYogaUnlimited.name + '. Payment for 1 month from May 16, 2019 to June 15, 2019.';

    comparePartialObject(
      createdOrderItems,
      [
        {
          client: testClientId,
          order: createdOrders[0].id,
          item_type: 'membership_renewal',
          item_id: membership.id,
          name: orderItemName,
          count: 1,
          item_price: fixtures.yogaUnlimitedPaymentOptionMonthly.payment_amount,
          total_price: fixtures.yogaUnlimitedPaymentOptionMonthly.payment_amount,
          membership_renewal_membership_type: fixtures.membershipTypeYogaUnlimited.id,
        },
      ],
    );

    const orderText = fixtures.userAlice.first_name + ' ' + fixtures.userAlice.last_name + '\n' + orderItemName;

    assert(apiRequestFake.calledWithExactly({
      merchant: fixtures.testClient1.dibs_merchant,
      ticket: paymentSubscription.payment_provider_subscription_id,
      amount: fixtures.yogaUnlimitedPaymentOptionMonthly.payment_amount * 100,
      currency: '208',
      orderid: createdOrders[0].id,
      ordertext: orderText,
      textreply: 'true',
      test: !sails.config.productionPayments,
      capturenow: 'yes',
    }));

    expect(emailSendFake.firstCall.args[0]).to.matchPattern(
      `{
        user: {id: ${fixtures.userAlice.id}, ... },
        subject: 'Receipt from Test client',
        ...
      }`,
    );

    await PaymentSubscription.destroy({id: paymentSubscription.id});

  });

  it('should fetch a free campaign "payment" and update system accordingly', async () => {

    const paymentSubscription = await PaymentSubscription.create({
      membership: membership.id,
      payment_provider_subscription_id: 'ppsi_123456',
      status: 'active',
      payment_service_provider: 'dibs',
    }).fetch();

    const campaign = await MembershipCampaign.create({
      name: 'Test campaign',
      number_of_months_at_reduced_price: 2,
      reduced_price: 0,
      min_number_of_months_since_customer_last_had_membership_type: 12,
    }).fetch();

    await Membership.update({id: membership.id}, {
      paid_until: '2019-05-15',
      renewal_failed: 0,
      renewal_failed_last_time: 0,
      membership_campaign: campaign.id,
      membership_campaign_number_of_reduced_payments_left: 2,
    });

    apiRequestFake = dibsApiRequestFakeFactory.replace();

    const timestampBeforeRunnningTest = moment().format('x');

    ////////////////////
    await sails.helpers.memberships.fetchMembershipPayment(membership);
    ////////////////////


    const updatedMembership = await Membership.findOne({id: membership.id});

    comparePartialObject(
      updatedMembership,
      {
        paid_until: new Date(moment.tz('2019-06-15', 'Europe/Copenhagen')),
        renewal_failed: 0,
        renewal_failed_last_time_at: 0,
        membership_campaign: campaign.id,
        membership_campaign_number_of_reduced_payments_left: 1,
      },
    );


    const createdOrders = await Order.find({membership: membership.id});

    comparePartialObject(
      createdOrders,
      [
        {
          membership: membership.id,
          test: 1,
          user: fixtures.userAlice.id,
          total: 0,
          client: testClientId,
          payment_subscription: paymentSubscription.id,
          transaction_id: 'FREE',
          pay_type: 'FREE',
          payment_service_provider: 'dibs',
        },
      ],
    );
    assert(createdOrders[0].paid > timestampBeforeRunnningTest);
    assert(createdOrders[0].paid < createdOrders[0].system_updated);
    assert(createdOrders[0].system_updated < moment().format('x'));

    const createdOrderItems = await OrderItem.find({order: createdOrders[0].id});

    const orderItemName = fixtures.membershipTypeYogaUnlimited.name + ' - Test campaign. Payment for 1 month from May 16, 2019 to June 15, 2019.';

    comparePartialObject(
      createdOrderItems,
      [
        {
          client: testClientId,
          order: createdOrders[0].id,
          item_type: 'membership_renewal',
          item_id: membership.id,
          name: orderItemName,
          count: 1,
          item_price: 0,
          total_price: 0,
          membership_renewal_membership_type: fixtures.membershipTypeYogaUnlimited.id,
        },
      ],
    );

    assert.strictEqual(
      apiRequestFake.callCount,
      0,
    );

    expect(emailSendFake.firstCall.args[0]).to.matchPattern(
      `{
        user: {id: ${fixtures.userAlice.id}, ... },
        subject: 'Receipt from Test client',
        ...
      }`,
    );

    await PaymentSubscription.destroy({id: paymentSubscription.id});
    await MembershipCampaign.destroy({id: campaign.id});
    await Membership.update({id: membership.id}, {
      membership_campaign: null,
      membership_campaign_number_of_reduced_payments_left: 0,
    });

  });

  it('should fetch a payment with reduced campaign price, remove campaign if it was the last reduced payment and update system accordingly', async () => {

    const campaign = await MembershipCampaign.create({
      name: 'Test campaign',
      number_of_months_at_reduced_price: 2,
      reduced_price: 99,
      min_number_of_months_since_customer_last_had_membership_type: 12,
    }).fetch();

    const paymentSubscription = await PaymentSubscription.create({
      membership: membership.id,
      payment_provider_subscription_id: 'ppsi_123456',
      status: 'active',
      payment_service_provider: 'dibs',
    }).fetch();

    await Membership.update({id: membership.id}, {
      paid_until: '2019-05-15',
      renewal_failed: 0,
      renewal_failed_last_time: 0,
      membership_campaign: campaign.id,
      membership_campaign_number_of_reduced_payments_left: 1,
    });

    apiRequestFake = dibsApiRequestFakeFactory.replace();

    const timestampBeforeRunnningTest = moment().format('x');

    ////////////////////
    await sails.helpers.memberships.fetchMembershipPayment(membership);
    ////////////////////


    const updatedMembership = await Membership.findOne({id: membership.id});

    comparePartialObject(
      updatedMembership,
      {
        paid_until: new Date(moment.tz('2019-06-15', 'Europe/Copenhagen')),
        renewal_failed: 0,
        renewal_failed_last_time_at: 0,
        membership_campaign: null,
        membership_campaign_number_of_reduced_payments_left: 0,
      },
    );

    const updatedPaymentSubscription = await PaymentSubscription.findOne(paymentSubscription.id);

    comparePartialObject(
      updatedPaymentSubscription,
      {
        membership: membership.id,
        status: 'active',
      },
    );

    const createdPaymentSubscriptionTransactions = await PaymentSubscriptionTransaction.find({
      payment_subscription: paymentSubscription.id,
    });

    comparePartialObject(
      createdPaymentSubscriptionTransactions,
      [
        {
          payment_subscription: paymentSubscription.id,
          status: 'accepted',
          amount: 99,
        },
      ],
    );


    const createdOrders = await Order.find({membership: membership.id});

    comparePartialObject(
      createdOrders,
      [
        {
          membership: membership.id,
          test: 1,
          user: fixtures.userAlice.id,
          total: 99,
          client: testClientId,
          payment_subscription: paymentSubscription.id,
          transaction_id: '123456',
          pay_type: 'V-DK',
          payment_service_provider: 'dibs',
        },
      ],
    );
    assert(createdOrders[0].paid > timestampBeforeRunnningTest);
    assert(createdOrders[0].paid < createdOrders[0].system_updated);
    assert(createdOrders[0].system_updated < moment().format('x'));

    const createdOrderItems = await OrderItem.find({order: createdOrders[0].id});

    const orderItemName = fixtures.membershipTypeYogaUnlimited.name + ' - Test campaign. Payment for 1 month from May 16, 2019 to June 15, 2019.';

    comparePartialObject(
      createdOrderItems,
      [
        {
          client: testClientId,
          order: createdOrders[0].id,
          item_type: 'membership_renewal',
          item_id: membership.id,
          name: orderItemName,
          count: 1,
          item_price: 99,
          total_price: 99,
          applied_discount_code_amount: 0,
          membership_renewal_membership_type: fixtures.membershipTypeYogaUnlimited.id,
        },
      ],
    );

    const orderText = fixtures.userAlice.first_name + ' ' + fixtures.userAlice.last_name + '\n' + orderItemName;

    assert(apiRequestFake.calledWithExactly({
      merchant: fixtures.testClient1.dibs_merchant,
      ticket: paymentSubscription.payment_provider_subscription_id,
      amount: 9900,
      currency: '208',
      orderid: createdOrders[0].id,
      ordertext: orderText,
      textreply: 'true',
      test: !sails.config.productionPayments,
      capturenow: 'yes',
    }));

    expect(emailSendFake.firstCall.args[0]).to.matchPattern(
      `{
        user: {id: ${fixtures.userAlice.id}, ... },
        subject: 'Receipt from Test client',
        ...
      }`,
    );

    await PaymentSubscription.destroy({id: paymentSubscription.id});
    await MembershipCampaign.destroy({id: campaign.id});

  });

  it('should fetch a payment with a discount code attached and calculate the price from the discount code', async () => {
    const discountCode = await DiscountCode.create({
      name: 'test_discount_code',
      client: testClientId,
      type: 'discount_percent',
      discount_percent: 25,
      valid_for_items: ['membership_types'],
    }).fetch();

    await Membership.update({id: membership.id}, {
      discount_code: discountCode.id,
      paid_until: '2018-05-14',
      status: 'active',
      renewal_failed: 0,
    });

    const paymentSubscription = await PaymentSubscription.create({
      membership: membership.id,
      payment_provider_subscription_id: 'ppsi_123456',
      status: 'active',
      payment_service_provider: 'dibs',
    }).fetch();

    apiRequestFake = dibsApiRequestFakeFactory.replace();

    const timestampBeforeRunnningTest = moment().format('x');

    ////////////////////
    await sails.helpers.memberships.fetchMembershipPayment(membership);
    ////////////////////

    const createdOrders = await Order.find({membership: membership.id});

    comparePartialObject(
      createdOrders,
      [
        {
          membership: membership.id,
          test: 1,
          user: fixtures.userAlice.id,
          total: 225,
          client: testClientId,
          payment_subscription: paymentSubscription.id,
          transaction_id: '123456',
          pay_type: 'V-DK',
          payment_service_provider: 'dibs',
        },
      ],
    );
    assert(createdOrders[0].paid > timestampBeforeRunnningTest);
    assert(createdOrders[0].paid < createdOrders[0].system_updated);
    assert(createdOrders[0].system_updated < moment().format('x'));

    const createdOrderItems = await OrderItem.find({order: createdOrders[0].id});

    const orderItemName = fixtures.membershipTypeYogaUnlimited.name + '. Payment for 1 month from May 15, 2018 to June 14, 2018. Discount code: "test_discount_code".';

    comparePartialObject(
      createdOrderItems,
      [
        {
          client: testClientId,
          order: createdOrders[0].id,
          item_type: 'membership_renewal',
          item_id: membership.id,
          name: orderItemName,
          count: 1,
          item_price: 225,
          total_price: 225,
          applied_discount_code_amount: 75,
          membership_renewal_membership_type: fixtures.membershipTypeYogaUnlimited.id,
        },
      ],
    );

    const orderText = fixtures.userAlice.first_name + ' ' + fixtures.userAlice.last_name + '\n' + orderItemName;

    assert(apiRequestFake.calledWithExactly({
      merchant: fixtures.testClient1.dibs_merchant,
      ticket: paymentSubscription.payment_provider_subscription_id,
      amount: 22500,
      currency: '208',
      orderid: createdOrders[0].id,
      ordertext: orderText,
      textreply: 'true',
      test: !sails.config.productionPayments,
      capturenow: 'yes',
    }));

    expect(emailSendFake.firstCall.args[0]).to.matchPattern(
      `{
        user: {id: ${fixtures.userAlice.id}, ... },
        subject: 'Receipt from Test client',
        ...
      }`,
    );


    await Membership.update({id: membership.id}, {
      discount_code: null,
    });
    await PaymentSubscription.destroy({id: paymentSubscription.id});
    await DiscountCode.destroy({id: discountCode.id});

  });

  it('should fetch a payment with both campaign and discount code', async () => {
    const discountCode = await DiscountCode.create({
      name: 'test_discount_code',
      client: testClientId,
      type: 'discount_percent',
      discount_percent: 25,
      valid_for_items: ['membership_types'],
    }).fetch();

    const campaign = await MembershipCampaign.create({
      name: 'Test campaign',
      number_of_months_at_reduced_price: 2,
      reduced_price: 200,
      min_number_of_months_since_customer_last_had_membership_type: 12,
      client: testClientId,
    }).fetch();

    await Membership.update({id: membership.id}, {
      discount_code: discountCode.id,
      paid_until: '2018-05-14',
      status: 'active',
      renewal_failed: 0,
      membership_campaign: campaign.id,
      membership_campaign_number_of_reduced_payments_left: 1,
    });

    const paymentSubscription = await PaymentSubscription.create({
      membership: membership.id,
      payment_provider_subscription_id: 'ppsi_123456',
      status: 'active',
      payment_service_provider: 'dibs',
    }).fetch();

    apiRequestFake = dibsApiRequestFakeFactory.replace();

    const timestampBeforeRunnningTest = moment().format('x');

    ////////////////////
    await sails.helpers.memberships.fetchMembershipPayment(membership);
    ////////////////////

    const createdOrders = await Order.find({membership: membership.id});

    comparePartialObject(
      createdOrders,
      [
        {
          membership: membership.id,
          test: 1,
          user: fixtures.userAlice.id,
          total: 150,
          client: testClientId,
          payment_subscription: paymentSubscription.id,
          transaction_id: '123456',
          pay_type: 'V-DK',
          payment_service_provider: 'dibs',
        },
      ],
    );
    assert(createdOrders[0].paid > timestampBeforeRunnningTest);
    assert(createdOrders[0].paid < createdOrders[0].system_updated);
    assert(createdOrders[0].system_updated < moment().format('x'));

    const createdOrderItems = await OrderItem.find({order: createdOrders[0].id});

    const orderItemName = fixtures.membershipTypeYogaUnlimited.name + ' - Test campaign. Payment for 1 month from May 15, 2018 to June 14, 2018. Discount code: "test_discount_code".';

    comparePartialObject(
      createdOrderItems,
      [
        {
          client: testClientId,
          order: createdOrders[0].id,
          item_type: 'membership_renewal',
          item_id: membership.id,
          name: orderItemName,
          count: 1,
          item_price: 150,
          total_price: 150,
          applied_discount_code_amount: 50,
          membership_renewal_membership_type: fixtures.membershipTypeYogaUnlimited.id,
        },
      ],
    );

    const orderText = fixtures.userAlice.first_name + ' ' + fixtures.userAlice.last_name + '\n' + orderItemName;

    assert(apiRequestFake.calledWithExactly({
      merchant: fixtures.testClient1.dibs_merchant,
      ticket: paymentSubscription.payment_provider_subscription_id,
      amount: 15000,
      currency: '208',
      orderid: createdOrders[0].id,
      ordertext: orderText,
      textreply: 'true',
      test: !sails.config.productionPayments,
      capturenow: 'yes',
    }));

    expect(emailSendFake.firstCall.args[0]).to.matchPattern(
      `{
        user: {id: ${fixtures.userAlice.id}, ... },
        subject: 'Receipt from Test client',
        ...
      }`,
    );


    await Membership.update({id: membership.id}, {
      discount_code: null,
    });
    await PaymentSubscription.destroy({id: paymentSubscription.id});
    await DiscountCode.destroy({id: discountCode.id});

  });

  it('should fetch no-show fees along with the membership payment', async () => {

    const paymentSubscription = await PaymentSubscription.create({
      membership: membership.id,
      payment_provider_subscription_id: 'ppsi_123456',
      status: 'active',
      payment_service_provider: 'dibs',
    }).fetch();

    await Membership.update({id: membership.id}, {
      paid_until: '2019-05-15',
      renewal_failed: 0,
      renewal_failed_last_time: 0,
    });

    const classObj = await Class.create({
      client: testClientId,
      class_type: fixtures.classTypeYoga.id,
      date: '2019-05-14',
      start_time: '10:00:00',
      end_time: '12:00:00',
    }).fetch();

    const classSignup = await ClassSignup.create({
      client: testClientId,
      class: classObj.id,
      user: fixtures.userAlice.id,
      used_membership: membership.id,
    }).fetch();

    const noShowFee = await NoShowFee.create({
      client_id: testClientId,
      user_id: fixtures.userAlice.id,
      class_id: classObj.id,
      class_signup_id: classSignup.id,
      amount: 30,
      reason: 'late_cancel',
      membership_id: membership.id,
    }).fetch();

    apiRequestFake = dibsApiRequestFakeFactory.replace();

    const timestampBeforeRunnningTest = moment().format('x');

    ////////////////////
    await sails.helpers.memberships.fetchMembershipPayment(membership);
    ////////////////////


    const updatedMembership = await Membership.findOne({id: membership.id});

    comparePartialObject(
      updatedMembership,
      {
        paid_until: new Date(moment.tz('2019-06-15', 'Europe/Copenhagen')),
        renewal_failed: 0,
        renewal_failed_last_time_at: 0,
      },
    );


    const createdOrders = await Order.find({membership: membership.id});

    comparePartialObject(
      createdOrders,
      [
        {
          membership: membership.id,
          test: 1,
          user: fixtures.userAlice.id,
          total: fixtures.yogaUnlimitedPaymentOptionMonthly.payment_amount + noShowFee.amount,
          client: testClientId,
          payment_subscription: paymentSubscription.id,
          transaction_id: '123456',
          pay_type: 'V-DK',
          payment_service_provider: 'dibs',
        },
      ],
    );
    assert(createdOrders[0].paid > timestampBeforeRunnningTest);
    assert(createdOrders[0].paid < createdOrders[0].system_updated);
    assert(createdOrders[0].system_updated < Date.now());

    const createdOrderItems = await OrderItem.find({order: createdOrders[0].id});

    expect(createdOrderItems).to.matchPattern(`
      [
        {
          client: ${testClientId},
          order: ${createdOrders[0].id},
          item_type: 'membership_renewal',
          item_id: ${membership.id},
          name: '${fixtures.membershipTypeYogaUnlimited.name}. Payment for 1 month from May 16, 2019 to June 15, 2019.',
          count: 1,
          item_price: ${fixtures.yogaUnlimitedPaymentOptionMonthly.payment_amount},
          total_price: ${fixtures.yogaUnlimitedPaymentOptionMonthly.payment_amount},
          membership_renewal_membership_type: ${fixtures.membershipTypeYogaUnlimited.id},
          ...
        },
        {
          client: ${testClientId},
          order: ${createdOrders[0].id},
          item_type: 'membership_no_show_fee',
          item_id: ${noShowFee.id},
          name: 'No-show fee for Yoga, Tuesday, May 14, 2019 10:00',
          count: 1,
          item_price: ${noShowFee.amount},
          total_price: ${noShowFee.amount},
          ...
        }  
      ]`,
    );

    const orderText = fixtures.userAlice.first_name + ' ' + fixtures.userAlice.last_name + '\n' + fixtures.membershipTypeYogaUnlimited.name + '. Payment for 1 month from May 16, 2019 to June 15, 2019.,\nNo-show fee for Yoga, Tuesday, May 14, 2019 10:00';

    expect(apiRequestFake.getCall(0).args[0]).to.matchPattern({
      merchant: fixtures.testClient1.dibs_merchant,
      ticket: paymentSubscription.payment_provider_subscription_id,
      amount: (fixtures.yogaUnlimitedPaymentOptionMonthly.payment_amount + noShowFee.amount) * 100,
      currency: '208',
      orderid: createdOrders[0].id,
      ordertext: orderText,
      textreply: 'true',
      test: !sails.config.productionPayments,
      capturenow: 'yes',
    });

    expect(emailSendFake.firstCall.args[0]).to.matchPattern(
      `{
        user: {id: ${fixtures.userAlice.id}, ... },
        subject: 'Receipt from Test client',
        ...
      }`,
    );

    const updatedNoShowFee = await NoShowFee.findOne(noShowFee.id);
    expect(updatedNoShowFee).to.matchPattern(`{
      paid_with_order_id: ${createdOrders[0].id},
      ... 
    }`);

    await PaymentSubscription.destroy({id: paymentSubscription.id});
    await ClassSignup.destroy({id: classSignup.id});
    await Class.destroy({id: classObj.id});
    await NoShowFee.destroy({id: noShowFee.id});

  });

  it('should fetch no-show fees even if the membership payment is 0', async () => {

    const paymentSubscription = await PaymentSubscription.create({
      membership: membership.id,
      payment_provider_subscription_id: 'ppsi_123456',
      status: 'active',
      payment_service_provider: 'dibs',
    }).fetch();

    const discountCode = await DiscountCode.create({
      name: 'test_discount_code',
      client: testClientId,
      type: 'discount_percent',
      discount_percent: 100,
      valid_for_items: ['membership_types'],
    }).fetch();

    await Membership.update({id: membership.id}, {
      paid_until: '2019-05-15',
      renewal_failed: 0,
      renewal_failed_last_time: 0,
      discount_code: discountCode.id,
    });

    const classObj = await Class.create({
      client: testClientId,
      class_type: fixtures.classTypeYoga.id,
      date: '2019-05-14',
      start_time: '10:00:00',
      end_time: '12:00:00',
    }).fetch();

    const classSignup = await ClassSignup.create({
      client: testClientId,
      class: classObj.id,
      user: fixtures.userAlice.id,
      used_membership: membership.id,
    }).fetch();

    const noShowFee = await NoShowFee.create({
      client_id: testClientId,
      user_id: fixtures.userAlice.id,
      class_id: classObj.id,
      class_signup_id: classSignup.id,
      amount: 30,
      reason: 'late_cancel',
      membership_id: membership.id,
    }).fetch();

    apiRequestFake = dibsApiRequestFakeFactory.replace();

    const timestampBeforeRunnningTest = moment().format('x');

    ////////////////////
    await sails.helpers.memberships.fetchMembershipPayment(membership);
    ////////////////////


    const updatedMembership = await Membership.findOne({id: membership.id});

    comparePartialObject(
      updatedMembership,
      {
        paid_until: new Date(moment.tz('2019-06-15', 'Europe/Copenhagen')),
        renewal_failed: 0,
        renewal_failed_last_time_at: 0,
      },
    );


    const createdOrders = await Order.find({membership: membership.id});

    comparePartialObject(
      createdOrders,
      [
        {
          membership: membership.id,
          test: 1,
          user: fixtures.userAlice.id,
          total: 30,
          client: testClientId,
          payment_subscription: paymentSubscription.id,
          transaction_id: '123456',
          pay_type: 'V-DK',
          payment_service_provider: 'dibs',
        },
      ],
    );
    assert(createdOrders[0].paid > timestampBeforeRunnningTest);
    assert(createdOrders[0].paid < createdOrders[0].system_updated);
    assert(createdOrders[0].system_updated < Date.now());

    const createdOrderItems = await OrderItem.find({order: createdOrders[0].id});

    createdOrderItems.sort((a, b) => {
      return a.item_type > b.item_type ? -1 : 1;

    });

    expect(createdOrderItems).to.matchPattern(`
      [
        {
          client: ${testClientId},
          order: ${createdOrders[0].id},
          item_type: 'membership_renewal',
          item_id: ${membership.id},
          name: '${fixtures.membershipTypeYogaUnlimited.name}. Payment for 1 month from May 16, 2019 to June 15, 2019. Discount code: "test_discount_code".',
          count: 1,
          item_price: 0,
          total_price: 0,
          membership_renewal_membership_type: ${fixtures.membershipTypeYogaUnlimited.id},
          ...
        },
        {
          client: ${testClientId},
          order: ${createdOrders[0].id},
          item_type: 'membership_no_show_fee',
          item_id: ${noShowFee.id},
          name: 'No-show fee for Yoga, Tuesday, May 14, 2019 10:00',
          count: 1,
          item_price: 30,
          total_price: 30,
          ...
        }  
      ]`,
    );

    const orderText = fixtures.userAlice.first_name + ' ' + fixtures.userAlice.last_name + '\nNo-show fee for Yoga, Tuesday, May 14, 2019 10:00,\n' + fixtures.membershipTypeYogaUnlimited.name + '. Payment for 1 month from May 16, 2019 to June 15, 2019. Discount code: "test_discount_code".';

    expect(apiRequestFake.getCall(0).args[0]).to.matchPattern({
      merchant: fixtures.testClient1.dibs_merchant,
      ticket: paymentSubscription.payment_provider_subscription_id,
      amount: 3000,
      currency: '208',
      orderid: createdOrders[0].id,
      ordertext: orderText,
      textreply: 'true',
      test: !sails.config.productionPayments,
      capturenow: 'yes',
    });

    expect(emailSendFake.firstCall.args[0]).to.matchPattern(
      `{
        user: {id: ${fixtures.userAlice.id}, ... },
        subject: 'Receipt from Test client',
        ...
      }`,
    );

    const updatedNoShowFee = await NoShowFee.findOne(noShowFee.id);
    expect(updatedNoShowFee).to.matchPattern(`{
      paid_with_order_id: ${createdOrders[0].id},
      ... 
    }`);

    await Membership.update({id: membership.id}, {discount_code: null});
    await PaymentSubscription.destroy({id: paymentSubscription.id});
    await ClassSignup.destroy({id: classSignup.id});
    await Class.destroy({id: classObj.id});
    await NoShowFee.destroy({id: noShowFee.id});

  });

  it('should try to fetch a payment and when it fails, update system accordingly', async () => {

    const paymentSubscription = await PaymentSubscription.create({
      membership: membership.id,
      payment_provider_subscription_id: 'ppsi_123456',
      status: 'active',
      payment_service_provider: 'dibs',
    }).fetch();

    await Membership.update({id: membership.id}, {
      paid_until: '2019-05-15',
      renewal_failed: 0,
      renewal_failed_last_time: 0,
      payment_option: fixtures.yogaUnlimitedPaymentOptionSemiannually.id,
    });

    apiRequestFake = dibsApiRequestFakeFactory.replace({status: 'DECLINED'});

    const timestampBeforeRunnningTest = Date.now();

    ////////////////////
    await sails.helpers.memberships.fetchMembershipPayment(membership);
    ////////////////////

    const updatedMembership = await Membership.findOne({id: membership.id});

    comparePartialObject(
      updatedMembership.toJSON(),
      {
        paid_until: '2019-05-15',
        renewal_failed: 1,
      },
    );
    assert(updatedMembership.renewal_failed_last_time_at > timestampBeforeRunnningTest);
    assert(updatedMembership.renewal_failed_last_time_at < Date.now());

    const updatedPaymentSubscription = await PaymentSubscription.findOne(paymentSubscription.id);

    comparePartialObject(
      updatedPaymentSubscription,
      {
        membership: membership.id,
        status: 'active',
      },
    );

    const createdPaymentSubscriptionTransactions = await PaymentSubscriptionTransaction.find({
      payment_subscription: paymentSubscription.id,
    });

    comparePartialObject(
      createdPaymentSubscriptionTransactions,
      [
        {
          payment_subscription: paymentSubscription.id,
          status: 'failed',
          comment: 'Test reason',
        },
      ],
    );


    const createdOrders = await Order.find({membership: membership.id});

    comparePartialObject(
      createdOrders,
      [
        {
          membership: membership.id,
          test: 1,
          user: fixtures.userAlice.id,
          total: fixtures.yogaUnlimitedPaymentOptionSemiannually.payment_amount,
          client: testClientId,
          payment_subscription: paymentSubscription.id,
          payment_service_provider: 'dibs',
          paid: 0,
          system_updated: 0,
          receipt_sent: 0,
        },
      ],
    );
    assert(createdOrders[0].payment_failed > timestampBeforeRunnningTest);
    assert(createdOrders[0].payment_failed < moment().format('x'));


    const createdOrderItems = await OrderItem.find({order: createdOrders[0].id});

    const orderItemName = fixtures.membershipTypeYogaUnlimited.name + '. Payment for 6 months from May 16, 2019 to November 15, 2019.';

    comparePartialObject(
      createdOrderItems,
      [
        {
          client: testClientId,
          order: createdOrders[0].id,
          item_type: 'membership_renewal',
          item_id: membership.id,
          name: orderItemName,
          count: 1,
          item_price: fixtures.yogaUnlimitedPaymentOptionSemiannually.payment_amount,
          total_price: fixtures.yogaUnlimitedPaymentOptionSemiannually.payment_amount,
          membership_renewal_membership_type: fixtures.membershipTypeYogaUnlimited.id,
        },
      ],
    );

    const orderText = fixtures.userAlice.first_name + ' ' + fixtures.userAlice.last_name + '\n' + orderItemName;

    assert(apiRequestFake.calledWithExactly({
      merchant: fixtures.testClient1.dibs_merchant,
      ticket: paymentSubscription.payment_provider_subscription_id,
      amount: fixtures.yogaUnlimitedPaymentOptionSemiannually.payment_amount * 100,
      currency: '208',
      orderid: createdOrders[0].id,
      ordertext: orderText,
      textreply: 'true',
      test: !sails.config.productionPayments,
      capturenow: 'yes',
    }));

    expect(emailSendFake.firstCall.args[0]).to.matchPattern(
      `{
        user: {id: ${fixtures.userAlice.id}, ... },
        subject: 'We could not renew your membership',
        ...
      }`,
    );

    await PaymentSubscription.destroy({id: paymentSubscription.id});

    await Membership.update({id: membership.id}, {
      paid_until: '2019-05-15',
      renewal_failed: 0,
      renewal_failed_last_time: 0,
      payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
    });

  });

  it('should terminate membership if payment has failed a certain number of times', async () => {

    const paymentSubscription = await PaymentSubscription.create({
      membership: membership.id,
      payment_provider_subscription_id: 'ppsi_123456',
      status: 'active',
      payment_service_provider: 'dibs',
    }).fetch();

    await Membership.update({id: membership.id}, {
      paid_until: '2019-05-15',
      renewal_failed: 4,
      renewal_failed_last_time: 0,
    });

    dibsApiRequestFakeFactory.replace({status: 'DECLINED'});

    const timestampBeforeRunnningTest = moment().format('x');

    ////////////////////
    await sails.helpers.memberships.fetchMembershipPayment(membership);
    ////////////////////

    const updatedMembership = await Membership.findOne({id: membership.id});

    comparePartialObject(
      updatedMembership,
      {
        status: 'ended',
        ended_because: 'payment_failed',
        paid_until: new Date(moment.tz('2019-05-15', 'Europe/Copenhagen')),
        renewal_failed: 5,
      },
    );
    assert(updatedMembership.renewal_failed_last_time_at > timestampBeforeRunnningTest);
    assert(updatedMembership.renewal_failed_last_time_at < moment().format('x'));

    expect(emailSendFake.firstCall.args[0]).to.matchPattern(`
      {
        user: {id: ${fixtures.userAlice.id}, ... },
        subject: 'Your membership has been cancelled',
        ...
      }`,
    );

    await PaymentSubscription.destroy({id: paymentSubscription.id});

  });

  it('should fail and inform the customer if there are no payment subscriptions', async () => {

    await Membership.update({id: membership.id}, {
      paid_until: '2019-05-15',
      renewal_failed: 0,
      renewal_failed_last_time: 0,
    });

    const timestampBeforeRunnningTest = moment().format('x');

    ////////////////////
    await sails.helpers.memberships.fetchMembershipPayment(membership);
    ////////////////////

    const updatedMembership = await Membership.findOne({id: membership.id});

    comparePartialObject(
      updatedMembership,
      {
        paid_until: new Date(moment.tz('2019-05-15', 'Europe/Copenhagen')),
        renewal_failed: 1,
      },
    );
    assert(updatedMembership.renewal_failed_last_time_at > timestampBeforeRunnningTest);
    assert(updatedMembership.renewal_failed_last_time_at < moment().format('x'));


    expect(emailSendFake.firstCall.args[0]).to.matchPattern(`
      {
        user: {id: ${fixtures.userAlice.id}, ... },
        subject: 'We could not renew your membership',
        ...
      }`,
    );

  });

  it('should throw an error if there are more than one payment subscription', async () => {
    const paymentSubscriptions = await PaymentSubscription.createEach([{
      membership: membership.id,
      payment_provider_subscription_id: 'ppsi_123456',
      status: 'active',
      payment_service_provider: 'dibs',
    }, {
      membership: membership.id,
      payment_provider_subscription_id: 'ppsi_123456_2',
      status: 'active',
      payment_service_provider: 'dibs',
    }]).fetch();

    await assertAsyncThrows(async () => {
        await sails.helpers.memberships.fetchMembershipPayment(membership);
      },
      'moreThanOnePaymentSubscription',
    );

    await PaymentSubscription.destroy({id: _.map(paymentSubscriptions, 'id')});

  });

  it('should skip sending receipt on email', async () => {

    const paymentSubscription = await PaymentSubscription.create({
      membership: membership.id,
      payment_provider_subscription_id: 'ppsi_123456',
      status: 'active',
      payment_service_provider: 'dibs',
    }).fetch();

    await Membership.update({id: membership.id}, {
      paid_until: '2019-05-15',
      renewal_failed: 0,
      renewal_failed_last_time: 0,
    });

    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'send_receipt_on_email_for_automatic_membership_payments',
      value: 0,
    }).fetch();

    apiRequestFake = dibsApiRequestFakeFactory.replace();

    const timestampBeforeRunnningTest = moment().format('x');

    ////////////////////
    await sails.helpers.memberships.fetchMembershipPayment(membership);
    ////////////////////


    const updatedMembership = await Membership.findOne({id: membership.id});

    comparePartialObject(
      updatedMembership,
      {
        paid_until: new Date(moment.tz('2019-06-15', 'Europe/Copenhagen')),
        renewal_failed: 0,
        renewal_failed_last_time_at: 0,
      },
    );

    const updatedPaymentSubscription = await PaymentSubscription.findOne(paymentSubscription.id);

    comparePartialObject(
      updatedPaymentSubscription,
      {
        membership: membership.id,
        status: 'active',
      },
    );

    const createdPaymentSubscriptionTransactions = await PaymentSubscriptionTransaction.find({
      payment_subscription: paymentSubscription.id,
    });

    comparePartialObject(
      createdPaymentSubscriptionTransactions,
      [
        {
          payment_subscription: paymentSubscription.id,
          status: 'accepted',
          amount: fixtures.yogaUnlimitedPaymentOptionMonthly.payment_amount,
        },
      ],
    );


    const createdOrders = await Order.find({membership: membership.id});

    comparePartialObject(
      createdOrders,
      [
        {
          membership: membership.id,
          test: 1,
          user: fixtures.userAlice.id,
          total: fixtures.yogaUnlimitedPaymentOptionMonthly.payment_amount,
          client: testClientId,
          payment_subscription: paymentSubscription.id,
          transaction_id: '123456',
          pay_type: 'V-DK',
          payment_service_provider: 'dibs',
        },
      ],
    );
    assert(createdOrders[0].paid > timestampBeforeRunnningTest);
    assert(createdOrders[0].paid < createdOrders[0].system_updated);
    assert(createdOrders[0].system_updated < moment().format('x'));

    const createdOrderItems = await OrderItem.find({order: createdOrders[0].id});

    const orderItemName = fixtures.membershipTypeYogaUnlimited.name + '. Payment for 1 month from May 16, 2019 to June 15, 2019.';

    comparePartialObject(
      createdOrderItems,
      [
        {
          client: testClientId,
          order: createdOrders[0].id,
          item_type: 'membership_renewal',
          item_id: membership.id,
          name: orderItemName,
          count: 1,
          item_price: fixtures.yogaUnlimitedPaymentOptionMonthly.payment_amount,
          total_price: fixtures.yogaUnlimitedPaymentOptionMonthly.payment_amount,
          membership_renewal_membership_type: fixtures.membershipTypeYogaUnlimited.id,
        },
      ],
    );

    const orderText = fixtures.userAlice.first_name + ' ' + fixtures.userAlice.last_name + '\n' + orderItemName;

    assert(apiRequestFake.calledWithExactly({
      merchant: fixtures.testClient1.dibs_merchant,
      ticket: paymentSubscription.payment_provider_subscription_id,
      amount: fixtures.yogaUnlimitedPaymentOptionMonthly.payment_amount * 100,
      currency: '208',
      orderid: createdOrders[0].id,
      ordertext: orderText,
      textreply: 'true',
      test: !sails.config.productionPayments,
      capturenow: 'yes',
    }));

    expect(emailSendFake.callCount).to.equal(0);

    await PaymentSubscription.destroy({id: paymentSubscription.id});

    await ClientSettings.destroy({id: clientSettingsRow.id});

  });

});
