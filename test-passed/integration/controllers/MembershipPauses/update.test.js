const moment = require('moment-timezone');
const supertest = require('supertest');

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID;
const fixtures = require('../../../fixtures/factory').fixtures;
const {
  authorizeAdmin,
  authorizeUserAlice,
  acceptExtendedErrorFormat,
} = require('../../../utils/request-helpers');

const MockDate = require('mockdate');

const sinon = require('sinon');
const emailSendFakeFactory = require('../../../fakes/email-send-fake-factory');

describe('controllers.MembershipPauses.update', async function () {

  let emailSendFake;

  before(async () => {
    await MembershipLog.destroy({});
    await OrderItem.destroy({});
  });

  beforeEach(async () => {
    emailSendFake = emailSendFakeFactory.installEmailSendFake();

    pdfReceiptFake = sinon.fake.returns(Buffer.from('Test'));
    sinon.replace(sails.helpers.order, 'pdfReceipt', pdfReceiptFake);
    await MembershipLog.destroy({});
  });

  afterEach(async () => {
    sinon.restore();
  });

  it('should fail if user is not logged in', async () => {

    const membership = await Membership.create({
      client: testClientId,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      paid_until: '2020-05-31',
      status: 'active',
      user: fixtures.userAlice.id,
    }).fetch();

    const membershipPause = await MembershipPause.create({
      client_id: testClientId,
      membership_id: membership.id,
      start_date: '2020-06-01',
    }).fetch();

    await supertest(sails.hooks.http.app)
      .put(`/membership-pauses/${membershipPause.id}?client=${testClientId}`)
      .send(
        {
          start_date: '2020-06-13',
        },
      )
      .expect(403);

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: membershipPause.id});
  });

  it('should fail if user is the customer owning the membership', async () => {

    const membership = await Membership.create({
      client: testClientId,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      paid_until: '2020-05-31',
      status: 'active',
      user: fixtures.userAlice.id,
    }).fetch();

    const membershipPause = await MembershipPause.create({
      client_id: testClientId,
      membership_id: membership.id,
      start_date: '2020-06-01',
    }).fetch();

    await supertest(sails.hooks.http.app)
      .put(`/membership-pauses/${membershipPause.id}?client=${testClientId}`)
      .send(
        {
          start_date: '2020-06-13',
        },
      )
      .use(authorizeUserAlice())
      .expect(403);

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: membershipPause.id});
  });

  it('should return notFound', async () => {

    const membership = await Membership.create({
      client: testClientId,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      paid_until: '2020-05-31',
      status: 'active',
      user: fixtures.userAlice.id,
    }).fetch();

    const membershipPause = await MembershipPause.create({
      client_id: testClientId,
      membership_id: membership.id,
      start_date: '2020-06-01',
      archived: true,
    }).fetch();

    await supertest(sails.hooks.http.app)
      .put(`/membership-pauses/${membershipPause.id}?client=${testClientId}`)
      .send(
        {
          start_date: '2020-06-13',
        },
      )
      .use(authorizeAdmin())
      .expect(404);

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: membershipPause.id});

  });

  it('should fail if end date is the same as start date', async () => {

    const membership = await Membership.create({
      client: testClientId,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      paid_until: '2020-05-31',
      status: 'active',
    }).fetch();

    const membershipPause = await MembershipPause.create({
      client_id: testClientId,
      membership_id: membership.id,
      start_date: '2020-06-01',
      end_date: '2020-07-01',
    }).fetch();

    const expectedError = {
      error: {
        type: 'MembershipPauseEndDateMustBeSameOrAfterStartDate',
        localized_title: 'Invalid dates',
        localized_message: 'Pause end date must be later than pause start date',
      },
    };

    MockDate.set(moment.tz('2020-05-01', 'Europe/Copenhagen'));
    const {body: errorResponse} = await supertest(sails.hooks.http.app)
      .put(`/membership-pauses/${membershipPause.id}?client=${testClientId}`)
      .send(
        {
          start_date: '2020-07-01',
        },
      )
      .use(acceptExtendedErrorFormat())
      .use(authorizeAdmin())
      .expect(200);

    expect(errorResponse).to.matchPattern(expectedError);

    const {body: errorResponse2} = await supertest(sails.hooks.http.app)
      .put(`/membership-pauses/${membershipPause.id}?client=${testClientId}`)
      .send(
        {
          end_date: '2020-06-01',
        },
      )
      .use(acceptExtendedErrorFormat())
      .use(authorizeAdmin())
      .expect(200);

    expect(errorResponse2).to.matchPattern(expectedError);

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: membershipPause.id});

  });

  it('should fail if end date is before start date', async () => {

    const membership = await Membership.create({
      client: testClientId,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      paid_until: '2020-05-31',
      status: 'active',
    }).fetch();

    const membershipPause = await MembershipPause.create({
      client_id: testClientId,
      membership_id: membership.id,
      start_date: '2020-06-01',
      end_date: '2020-07-01',
    }).fetch();

    const expectedError = {
      error: {
        type: 'MembershipPauseEndDateMustBeSameOrAfterStartDate',
        localized_title: 'Invalid dates',
        localized_message: 'Pause end date must be later than pause start date',
      },
    };

    MockDate.set(moment.tz('2020-05-01', 'Europe/Copenhagen'));
    const {body: errorResponse} = await supertest(sails.hooks.http.app)
      .put(`/membership-pauses/${membershipPause.id}?client=${testClientId}`)
      .send(
        {
          start_date: '2020-07-02',
        },
      )
      .use(acceptExtendedErrorFormat())
      .use(authorizeAdmin())
      .expect(200);

    expect(errorResponse).to.matchPattern(expectedError);

    const {body: errorResponse2} = await supertest(sails.hooks.http.app)
      .put(`/membership-pauses/${membershipPause.id}?client=${testClientId}`)
      .send(
        {
          end_date: '2020-05-31',
        },
      )
      .use(acceptExtendedErrorFormat())
      .use(authorizeAdmin())
      .expect(200);

    expect(errorResponse2).to.matchPattern(expectedError);

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: membershipPause.id});

  });

  it('should fail if not editing the last membership pause', async () => {

    const membership = await Membership.create({
      client: testClientId,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      paid_until: '2020-05-31',
      status: 'ended',
    }).fetch();

    const membershipPauses = await MembershipPause.createEach([
      {
        client_id: testClientId,
        membership_id: membership.id,
        start_date: '2020-05-01',
        end_date: '2020-05-15',
      },
      {
        client_id: testClientId,
        membership_id: membership.id,
        start_date: '2020-06-10',
        end_date: '2020-06-20',
      },
    ]).fetch();

    const {body: errorResponse} = await supertest(sails.hooks.http.app)
      .put(`/membership-pauses/${membershipPauses[0].id}?client=${testClientId}`)
      .send(
        {
          start_date: '2020-05-02',
        },
      )
      .use(acceptExtendedErrorFormat())
      .use(authorizeAdmin())
      .expect(200);

    expect(errorResponse).to.matchPattern({
      error: {
        type: 'OnlyTheLastMembershipPauseCanBeChanged',
        localized_title: 'Membership pause can not be changed',
        localized_message: 'Only the last membership pause can be changed',
      },
    });

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: _.map(membershipPauses, 'id')});

  });

  it('should fail if membership pause has ended', async () => {

    const membership = await Membership.create({
      client: testClientId,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      paid_until: '2020-05-31',
      status: 'cancelled_running',
      cancelled_from_date: '2020-07-01',
    }).fetch();

    const membershipPause = await MembershipPause.create({
      client_id: testClientId,
      membership_id: membership.id,
      start_date: '2020-05-01',
      end_date: '2020-05-15',
    }).fetch();

    MockDate.set(moment.tz('2020-05-31', 'Europe/Copenhagen'));
    const {body: errorResponse} = await supertest(sails.hooks.http.app)
      .put(`/membership-pauses/${membershipPause.id}?client=${testClientId}`)
      .send(
        {
          start_date: '2020-05-02',
        },
      )
      .use(acceptExtendedErrorFormat())
      .use(authorizeAdmin())
      .expect(200);

    expect(errorResponse).to.matchPattern({
      error: {
        type: 'MembershipPauseHasEndedAndCanNotBeChanged',
        localized_title: 'Pause has ended',
        localized_message: 'A Membership pause that has ended can not be changed.',
      },
    });

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: membershipPause.id});

  });

  it('should fail if requested change will result in a payment date more than 28 days before today', async () => {

    const membership = await Membership.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      paid_until: '2020-03-31',
      status: 'active',
    }).fetch();

    const membershipPause = await MembershipPause.create({
      client_id: testClientId,
      membership_id: membership.id,
      start_date: '2020-03-01',
      end_date: '2020-07-01',
    }).fetch();

    MockDate.set(moment.tz('2020-06-01', 'Europe/Copenhagen'));
    const {body: errorResponse} = await supertest(sails.hooks.http.app)
      .put(`/membership-pauses/${membershipPause.id}?client=${testClientId}`)
      .send(
        {
          end_date: '2020-04-01',
        },
      )
      .use(acceptExtendedErrorFormat())
      .use(authorizeAdmin())
      .expect(200);

    expect(errorResponse).to.matchPattern({
      error: {
        type: 'CantEditMembershipPauseBecausePaymentDateIsTooEarly',
        localized_title: 'New payment date is too early',
        localized_message: 'Membership pause can not be edited like this because it would result in a too early payment date and might cause multiple automatic payments.',
      },
    });

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: membershipPause.id});

  });

  it('should fail if new fee is specified but fee is already paid', async () => {

    const membership = await Membership.create({
      client: testClientId,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      user: fixtures.userAlice.id,
      paid_until: '2020-05-31',
      status: 'active',
    }).fetch();

    const membershipPause = await MembershipPause.create({
      client_id: testClientId,
      membership_id: membership.id,
      start_date: '2020-05-05',
      end_date: '2020-06-05',
      fee: 200,
      fee_paid_with_order_id: 1,
    }).fetch();

    MockDate.set(moment.tz('2020-05-15', 'Europe/Copenhagen'));
    const {body: errorResponse} = await supertest(sails.hooks.http.app)
      .put(`/membership-pauses/${membershipPause.id}?client=${testClientId}`)
      .send(
        {
          fee: 300,
        },
      )
      .use(acceptExtendedErrorFormat())
      .use(authorizeAdmin())
      .expect(200);

    expect(errorResponse).to.matchPattern({
      error: {
        type: 'MembershipPauseFeePaidAndCanNotBeChanged',
        localized_title: 'Fee already paid',
        localized_message: 'Fee can not be changed as it has already been paid.',
      },
    });

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: membershipPause.id});

  });

  it('should succeed if fee is specified and no previous fee has been charged', async () => {

    const membership = await Membership.create({
      client: testClientId,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      user: fixtures.userAlice.id,
      paid_until: '2020-05-31',
      status: 'active',
    }).fetch();

    const paymentSubscription = await PaymentSubscription.create({
      membership: membership.id,
      payment_service_provider: 'reepay',
      payment_provider_subscription_id: 'id-12345',
      status: 'active',
    }).fetch();

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

    const membershipPause = await MembershipPause.create({
      client_id: testClientId,
      membership_id: membership.id,
      start_date: '2020-05-05',
      end_date: '2020-06-05',
      fee: 0,
    }).fetch();


    MockDate.set(moment.tz('2020-05-15', 'Europe/Copenhagen'));
    const timestampBeforeCall = Date.now();
    await supertest(sails.hooks.http.app)
      .put(`/membership-pauses/${membershipPause.id}?client=${testClientId}`)
      .send(
        {
          fee: 100,
        },
      )
      .use(acceptExtendedErrorFormat())
      .use(authorizeAdmin())
      .expect(200);
    const timestampAfterCall = Date.now();

    const createdOrders = await Order.find({});

    expect(createdOrders).to.matchPattern(`
      [
        {
          user: ${fixtures.userAlice.id},
          total: 100,
          client: ${testClientId},          
          paid: _.isBetween|${timestampBeforeCall - 1}|${timestampAfterCall + 1},
          system_updated: _.isBetween|${timestampBeforeCall - 1}|${timestampAfterCall + 1},
          receipt_sent: _.isBetween|${timestampBeforeCall - 1}|${timestampAfterCall + 1},
          ...
        },
      ]`,
    );

    const MembershipPauseObjection = require('../../../../api/objection-models/MembershipPause');
    const updatedMembershipPause = await MembershipPauseObjection.query().findById(membershipPause.id);

    expect(updatedMembershipPause).to.matchPattern(`{
      membership_id: ${membership.id},
      start_date: '2020-05-05',
      end_date: '2020-06-05',
      fee: 100,
      fee_paid_with_order_id: ${createdOrders[0].id},
      ...
    }`);

    const createdOrderItems = await OrderItem.find({});
    expect(createdOrderItems).to.matchPattern(`[{
      client: ${testClientId},
      order: ${createdOrders[0].id},
      name: 'Membership pause fee, Yoga Unlimited',
      item_type: 'membership_pause_fee',
      item_id: ${updatedMembershipPause.id},
      item_price: 100,
      count: 1,
      total_price: 100,
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
      entry: 'Membership pause fee of 100,00 kr collected.',
      ...
    },
    {
      client: ${testClientId},
      membership: ${membership.id},
      entry: 'Membership pause changed. Fee changed from 0,00 kr to 100,00 kr. Admin user: Admin Adminson.',
      ...
    }
    ]`);

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: membershipPause.id});
    await PaymentSubscription.destroy({id: paymentSubscription.id});
    await Order.destroy({});
    await OrderItem.destroy({});

  });

  it('should fail if fee is declined', async () => {

    const membership = await Membership.create({
      client: testClientId,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      user: fixtures.userAlice.id,
      paid_until: '2020-05-31',
      status: 'active',
    }).fetch();

    const membershipPause = await MembershipPause.create({
      client_id: testClientId,
      membership_id: membership.id,
      start_date: '2020-05-05',
      end_date: '2020-06-05',
      fee: 0,
    }).fetch();

    const paymentSubscription = await PaymentSubscription.create({
      membership: membership.id,
      payment_service_provider: 'reepay',
      payment_provider_subscription_id: 'id-12345',
      status: 'active',
    }).fetch();

    const chargeRequestFake = sinon.fake.resolves({
      state: 'failed',
    });
    sinon.replace(sails.helpers.paymentProvider.reepay.api, 'request', chargeRequestFake);

    MockDate.set(moment.tz('2020-05-15', 'Europe/Copenhagen'));
    const timestampBeforeCall = Date.now();
    const {body: response} = await supertest(sails.hooks.http.app)
      .put(`/membership-pauses/${membershipPause.id}?client=${testClientId}`)
      .send(
        {
          fee: 100,
        },
      )
      .use(acceptExtendedErrorFormat())
      .use(authorizeAdmin())
      .expect(200);

    expect(response).to.matchPattern(`{
      error: {
        type: 'MembershipPauseFeeWasDeclined',
        localized_title: 'Payment declined',
        localized_message: 'Fee for membership pause could not be charged. The payment was declined.'
      }
    }`);

    const timestampAfterCall = Date.now();

    const createdOrders = await Order.find({});

    expect(createdOrders).to.matchPattern(`
      [
        {
          user: ${fixtures.userAlice.id},
          total: 100,
          client: ${testClientId},          
          paid: 0,
          system_updated: 0,
          receipt_sent: 0,
          payment_failed: _.isBetween|${timestampBeforeCall - 1}|${timestampAfterCall + 1},
          ...
        },
      ]`,
    );

    expect(emailSendFake.callCount).to.equal(0);

    const MembershipPauseObjection = require('../../../../api/objection-models/MembershipPause');
    const updatedMembershipPause = await MembershipPauseObjection.query().findById(membershipPause.id);

    expect(updatedMembershipPause).to.matchPattern(`{
      membership_id: ${membership.id},
      start_date: '2020-05-05',
      end_date: '2020-06-05',
      fee: 0,
      fee_paid_with_order_id: null,
      archived: 0,
      ...
    }`);

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: updatedMembershipPause.id});
    await PaymentSubscription.destroy({id: paymentSubscription.id});
    await Order.destroy({});
    await OrderItem.destroy({});

  });

  it('should update all properties', async () => {

    const membership = await Membership.create({
      client: testClientId,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      user: fixtures.userAlice.id,
      paid_until: '2020-05-31',
      status: 'active',
    }).fetch();

    const paymentSubscription = await PaymentSubscription.create({
      membership: membership.id,
      payment_service_provider: 'reepay',
      payment_provider_subscription_id: 'id-12345',
      status: 'active',
    }).fetch();

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

    const membershipPause = await MembershipPause.create({
      client_id: testClientId,
      membership_id: membership.id,
      start_date: '2020-05-05',
      end_date: '2020-06-05',
      fee: 0,
    }).fetch();


    MockDate.set(moment.tz('2020-05-15', 'Europe/Copenhagen'));
    const timestampBeforeCall = Date.now();
    console.log("== before: ", `/membership-pauses/${membershipPause.id}?client=${testClientId}`);
    await supertest(sails.hooks.http.app)
      .put(`/membership-pauses/${membershipPause.id}?client=${testClientId}`)
      .send(
        {
          start_date: '2020-05-06',
          end_date: null,
          fee: 100,
          comment: 'New comment',
        },
      )
      .use(acceptExtendedErrorFormat())
      .use(authorizeAdmin())
      .expect(200);
    console.log("== after");
    const timestampAfterCall = Date.now();

    const createdOrders = await Order.find({});

    console.log("createdOrders = ", createdOrders)

    expect(createdOrders).to.matchPattern(`
      [
        {
          user: ${fixtures.userAlice.id},
          total: 100,
          client: ${testClientId},          
          paid: _.isBetween|${timestampBeforeCall - 1}|${timestampAfterCall + 1},
          system_updated: _.isBetween|${timestampBeforeCall - 1}|${timestampAfterCall + 1},
          receipt_sent: _.isBetween|${timestampBeforeCall - 1}|${timestampAfterCall + 1},
          ...
        },
      ]`,
    );

    const MembershipPauseObjection = require('../../../../api/objection-models/MembershipPause');
    const updatedMembershipPause = await MembershipPauseObjection.query().findById(membershipPause.id);

    expect(updatedMembershipPause).to.matchPattern(`{
      membership_id: ${membership.id},
      start_date: '2020-05-06',
      end_date: null,
      fee: 100,
      fee_paid_with_order_id: ${createdOrders[0].id},
      comment: 'New comment',
      ...
    }`);

    const createdOrderItems = await OrderItem.find({});
    expect(createdOrderItems).to.matchPattern(`[{
      client: ${testClientId},
      order: ${createdOrders[0].id},
      name: 'Membership pause fee, Yoga Unlimited',
      item_type: 'membership_pause_fee',
      item_id: ${updatedMembershipPause.id},
      item_price: 100,
      count: 1,
      total_price: 100,
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
      entry: 'Membership pause fee of 100,00 kr collected.',
      ...
    },
    {
      client: ${testClientId},
      membership: ${membership.id},
      entry: 'Membership pause changed. Start date changed from Tuesday, May 5, 2020 to Wednesday, May 6, 2020. End date changed from Friday, June 5, 2020 to indefinitely. Fee changed from 0,00 kr to 100,00 kr. Comment changed from "" to "New comment". Admin user: Admin Adminson.',
      ...
    }
    ]`);

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: membershipPause.id});
    await PaymentSubscription.destroy({id: paymentSubscription.id});
    await Order.destroy({});
    await OrderItem.destroy({});

  });

  it('should update end date from indefinitely to set date', async () => {

    const membership = await Membership.create({
      client: testClientId,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      user: fixtures.userAlice.id,
      paid_until: '2020-05-31',
      status: 'active',
    }).fetch();

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

    const membershipPause = await MembershipPause.create({
      client_id: testClientId,
      membership_id: membership.id,
      start_date: '2020-05-05',
      end_date: null,
      fee: 0,
    }).fetch();


    MockDate.set(moment.tz('2020-05-15', 'Europe/Copenhagen'));
    await supertest(sails.hooks.http.app)
      .put(`/membership-pauses/${membershipPause.id}?client=${testClientId}`)
      .send(
        {
          end_date: '2020-06-06',
        },
      )
      .use(acceptExtendedErrorFormat())
      .use(authorizeAdmin())
      .expect(200);

    const MembershipPauseObjection = require('../../../../api/objection-models/MembershipPause');
    const updatedMembershipPause = await MembershipPauseObjection.query().findById(membershipPause.id);

    expect(updatedMembershipPause).to.matchPattern(`{
      membership_id: ${membership.id},
      start_date: '2020-05-05',
      end_date: '2020-06-06',
      ...
    }`);

    const logEntries = await MembershipLog.find({});
    expect(logEntries).to.matchPattern(`[    
    {
      client: ${testClientId},
      membership: ${membership.id},
      entry: 'Membership pause changed. End date changed from indefinitely to Saturday, June 6, 2020. Admin user: Admin Adminson.',
      ...
    }
    ]`);

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: membershipPause.id});

  });


});
