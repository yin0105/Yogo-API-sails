const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID;
const fixtures = require('../../../fixtures/factory').fixtures;
const assert = require('assert');

const sinon = require('sinon');
const emailSendFakeFactory = require('../../../fakes/email-send-fake-factory');

describe('controllers.membership-pause.collect-fee', async function () {

  let emailSendFake;

  before(async () => {
    await Order.destroy({});
    await OrderItem.destroy({});
  })

  beforeEach(async () => {
    emailSendFake = emailSendFakeFactory.installEmailSendFake();

    const pdfReceiptFake = sinon.fake.returns(Buffer.from('Test'));
    sinon.replace(sails.helpers.order, 'pdfReceipt', pdfReceiptFake);
    await MembershipLog.destroy({});
    await CronLog.destroy({});

    await Membership.destroy({});
    await MembershipPause.destroy({});
    await PaymentSubscription.destroy({});
    await Order.destroy({});
    await OrderItem.destroy({});
  });

  afterEach(async () => {
    sinon.restore();
  });

  it('should throw if membership has too many payment subscriptions', async () => {

    const membership = await Membership.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      status: 'active',
    }).fetch();

    const paymentSubscriptions = await PaymentSubscription.createEach([
      {
        client: testClientId,
        membership: membership.id,
        payment_service_provider: 'reepay',
        status: 'active',
      },
      {
        client: testClientId,
        membership: membership.id,
        payment_service_provider: 'reepay',
        status: 'active',
      },
    ]).fetch();

    const membershipPause = await MembershipPause.create({
      client_id: testClientId,
      membership_id: membership.id,
      start_date: '2020-05-15'
    }).fetch();

    await expect(sails.helpers.membershipPause.collectFee(membershipPause)).to.be.rejectedWith('moreThanOnePaymentSubscription');

    await Membership.destroy({id: membership.id});
    await PaymentSubscription.destroy({id: _.map(paymentSubscriptions, 'id')});
    await MembershipPause.destroy({id: membershipPause.id});

  });

  it('should return false if membership has no payment subscriptions', async () => {

    const membership = await Membership.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      status: 'active',
    }).fetch();

    const membershipPause = await MembershipPause.create({
      client_id: testClientId,
      membership_id: membership.id,
      start_date: '2020-05-15'
    }).fetch();

    const result = await sails.helpers.membershipPause.collectFee(membershipPause);
    assert(result === false);

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: membershipPause.id});

  });

  it('should return false if fee is already paid', async () => {

    const membership = await Membership.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      status: 'active',
    }).fetch();

    const membershipPause = await MembershipPause.create({
      client_id: testClientId,
      membership_id: membership.id,
      start_date: '2020-05-15',
      fee: 200,
      fee_paid_with_order_id: 1234,
    }).fetch();

    const paymentSubscription = await PaymentSubscription.create(
      {
        client: testClientId,
        membership: membership.id,
        payment_service_provider: 'reepay',
        status: 'active',
      },
    ).fetch();

    const result = await sails.helpers.membershipPause.collectFee(membershipPause);
    assert(result === false);

    const cronLogEntries = await CronLog.find({});
    expect(cronLogEntries).to.matchPattern(`[{
      client: ${testClientId},      
      entry: 'Membership pause fee for membership ${membershipPause.id} already paid.',
      ...
    }]`);

    const membershipLogEntries = await MembershipLog.find({});
    expect(membershipLogEntries).to.matchPattern([]);


    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: membershipPause.id});
    await PaymentSubscription.destroy({id: paymentSubscription.id});

  });

  it('should collect a fee', async () => {

    const membership = await Membership.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      status: 'active',
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
    }).fetch();

    const membershipPause = await MembershipPause.create({
      client_id: testClientId,
      membership_id: membership.id,
      start_date: '2020-05-15',
      fee: 200,
    }).fetch();

    const paymentSubscription = await PaymentSubscription.create(
      {
        client: testClientId,
        membership: membership.id,
        payment_service_provider: 'reepay',
        status: 'active',
      },
    ).fetch();

    const chargeRequestFake = sinon.fake.resolves({
      state: 'settled',
      transaction: 'trans_1234567890',
      source: {
        card_type: 'visa',
        masked_card: '411111XXXXXX1111',
        exp_date: '06-24',
        recurring_payment_method: 'ca_1234567890',
      },
    });
    sinon.replace(sails.helpers.paymentProvider.reepay.api, 'request', chargeRequestFake);

    const timestampBeforeCall = Date.now();
    const result = await sails.helpers.membershipPause.collectFee(membershipPause);
    assert(result === true);

    const timestampAfterCall = Date.now();

    const createdOrders = await Order.find({});

    expect(createdOrders).to.matchPattern(`
      [
        {
          user: ${fixtures.userAlice.id},
          total: 200,
          client: ${testClientId},          
          paid: _.isBetween|${timestampBeforeCall - 1}|${timestampAfterCall + 1},
          system_updated: _.isBetween|${timestampBeforeCall - 1}|${timestampAfterCall + 1},
          receipt_sent: _.isBetween|${timestampBeforeCall - 1}|${timestampAfterCall + 1},
          ...
        },
      ]`,
    );

    const createdOrderItems = await OrderItem.find({});
    expect(createdOrderItems).to.matchPattern(`[{
      client: ${testClientId},
      order: ${createdOrders[0].id},
      name: 'Membership pause fee, Yoga Unlimited',
      item_type: 'membership_pause_fee',
      item_id: ${membershipPause.id},
      item_price: 200,
      count: 1,
      total_price: 200,
      vat_amount: 0,
      ...
    }]`);

    expect(emailSendFake.callCount).to.equal(1);
    expect(emailSendFake.firstCall.args[0]).to.matchPattern(`{
      subject: 'Receipt from Test client',
      text: 'Dear Alice,\\n\\nThanks for your purchase. This is your receipt.\\n\\nKind regards,\\nTest client',
      ...
    }`);


    const logEntries = await MembershipLog.find({});
    expect(logEntries).to.matchPattern(`[
    {
      client: ${testClientId},
      membership: ${membership.id},
      entry: 'Membership pause fee of 200,00 kr collected.',
      ...
    }    
    ]`);


    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: membershipPause.id});
    await PaymentSubscription.destroy({id: paymentSubscription.id});
    await Order.destroy({});
    await OrderItem.destroy({});

  });

  it('should skip sending receipt on email', async () => {

    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'membership_pause_fee_send_receipt_on_email',
      value: 0
    }).fetch();

    const membership = await Membership.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      status: 'active',
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
    }).fetch();

    const membershipPause = await MembershipPause.create({
      client_id: testClientId,
      membership_id: membership.id,
      start_date: '2020-05-15',
      fee: 200,
    }).fetch();

    const paymentSubscription = await PaymentSubscription.create(
      {
        client: testClientId,
        membership: membership.id,
        payment_service_provider: 'reepay',
        status: 'active',
      },
    ).fetch();

    const chargeRequestFake = sinon.fake.resolves({
      state: 'settled',
      transaction: 'trans_1234567890',
      source: {
        card_type: 'visa',
        masked_card: '411111XXXXXX1111',
        exp_date: '06-24',
        recurring_payment_method: 'ca_1234567890',
      },
    });
    sinon.replace(sails.helpers.paymentProvider.reepay.api, 'request', chargeRequestFake);

    const timestampBeforeCall = Date.now();
    const result = await sails.helpers.membershipPause.collectFee(membershipPause);
    assert(result === true);

    const timestampAfterCall = Date.now();

    const createdOrders = await Order.find({});

    expect(createdOrders).to.matchPattern(`
      [
        {
          user: ${fixtures.userAlice.id},
          total: 200,
          client: ${testClientId},          
          paid: _.isBetween|${timestampBeforeCall - 1}|${timestampAfterCall + 1},
          system_updated: _.isBetween|${timestampBeforeCall - 1}|${timestampAfterCall + 1},
          receipt_sent: 0,
          ...
        },
      ]`,
    );

    const createdOrderItems = await OrderItem.find({});
    expect(createdOrderItems).to.matchPattern(`[{
      client: ${testClientId},
      order: ${createdOrders[0].id},
      name: 'Membership pause fee, Yoga Unlimited',
      item_type: 'membership_pause_fee',
      item_id: ${membershipPause.id},
      item_price: 200,
      count: 1,
      total_price: 200,
      vat_amount: 0,
      ...
    }]`);

    expect(emailSendFake.callCount).to.equal(0);

    const logEntries = await MembershipLog.find({});
    expect(logEntries).to.matchPattern(`[
    {
      client: ${testClientId},
      membership: ${membership.id},
      entry: 'Membership pause fee of 200,00 kr collected.',
      ...
    }    
    ]`);

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: membershipPause.id});
    await PaymentSubscription.destroy({id: paymentSubscription.id});
    await Order.destroy({});
    await OrderItem.destroy({});
    await ClientSettings.destroy({id: clientSettingsRow.id});

  });

  it('should return false if payment fails', async () => {

    const membership = await Membership.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      status: 'active',
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
    }).fetch();

    const membershipPause = await MembershipPause.create({
      client_id: testClientId,
      membership_id: membership.id,
      start_date: '2020-05-15',
      fee: 200,
    }).fetch();

    const paymentSubscription = await PaymentSubscription.create(
      {
        client: testClientId,
        membership: membership.id,
        payment_service_provider: 'reepay',
        status: 'active',
      },
    ).fetch();

    const chargeRequestFake = sinon.fake.resolves({
      state: 'declined',
    });
    sinon.replace(sails.helpers.paymentProvider.reepay.api, 'request', chargeRequestFake);

    const result = await sails.helpers.membershipPause.collectFee(membershipPause);
    assert(result === false);

    const createdOrders = await Order.find({});

    expect(createdOrders).to.matchPattern(`
      [
        {
          user: ${fixtures.userAlice.id},
          total: 200,
          client: ${testClientId},          
          paid: 0,
          system_updated: 0,
          receipt_sent: 0,
          ...
        },
      ]`,
    );

    const createdOrderItems = await OrderItem.find({});
    expect(createdOrderItems).to.matchPattern(`[{
      client: ${testClientId},
      order: ${createdOrders[0].id},
      name: 'Membership pause fee, Yoga Unlimited',
      item_type: 'membership_pause_fee',
      item_id: ${membershipPause.id},
      item_price: 200,
      count: 1,
      total_price: 200,
      vat_amount: 0,
      ...
    }]`);

    expect(emailSendFake.callCount).to.equal(0);

    const logEntries = await MembershipLog.find({});
    expect(logEntries).to.matchPattern(`[]`);

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: membershipPause.id});
    await PaymentSubscription.destroy({id: paymentSubscription.id});
    await Order.destroy({});
    await OrderItem.destroy({});

  });

});
