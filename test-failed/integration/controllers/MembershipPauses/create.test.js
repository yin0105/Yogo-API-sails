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

describe('controllers.MembershipPauses.create', async function () {

  let emailSendFake;

  before(async () => {
    await MembershipLog.destroy({});
    await OrderItem.destroy({});
  });

  beforeEach(async () => {
    emailSendFake = emailSendFakeFactory.installEmailSendFake();

    pdfReceiptFake = sinon.fake.returns(new Buffer('Test'));
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

    await supertest(sails.hooks.http.app)
      .post(
        '/membership-pauses' +
        '?client=' + testClientId)
      .send(
        {
          start_date: '2020-06-13',
          end_date: '2020-06-13',
          membership: membership.id,
        },
      )
      .expect(403);

    await Membership.destroy({id: membership.id});
  });

  it('should fail if user is the customer owning the membership', async () => {

    const membership = await Membership.create({
      client: testClientId,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      paid_until: '2020-05-31',
      status: 'active',
      user: fixtures.userAlice.id,
    }).fetch();

    await supertest(sails.hooks.http.app)
      .post(
        '/membership-pauses' +
        '?client=' + testClientId)
      .send(
        {
          start_date: '2020-06-13',
          end_date: '2020-06-13',
          membership: membership.id,
        },
      )
      .use(authorizeUserAlice())
      .expect(403);

    await Membership.destroy({id: membership.id});
  });

  it('should fail if end date is the same as start date', async () => {

    const membership = await Membership.create({
      client: testClientId,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      paid_until: '2020-05-31',
      status: 'active',
    }).fetch();

    const {body: errorResponse} = await supertest(sails.hooks.http.app)
      .post(
        '/membership-pauses' +
        '?client=' + testClientId)
      .send(
        {
          start_date: '2020-06-13',
          end_date: '2020-06-13',
          membership: membership.id,
        },
      )
      .use(acceptExtendedErrorFormat())
      .use(authorizeAdmin())
      .expect(200);

    expect(errorResponse).to.matchPattern({
      error: {
        type: 'MembershipPauseEndDateMustBeSameOrAfterStartDate',
        localized_title: 'Invalid dates',
        localized_message: 'Pause end date must be later than pause start date',
      },
    });

    await Membership.destroy({id: membership.id});

  });

  it('should fail if end date is before start date', async () => {

    const membership = await Membership.create({
      client: testClientId,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      paid_until: '2020-05-31',
      status: 'active',
    }).fetch();

    const {body: errorResponse} = await supertest(sails.hooks.http.app)
      .post(
        '/membership-pauses' +
        '?client=' + testClientId)
      .send(
        {
          start_date: '2020-06-13',
          end_date: '2020-06-12',
          membership: membership.id,
        },
      )
      .use(acceptExtendedErrorFormat())
      .use(authorizeAdmin())
      .expect(200);

    expect(errorResponse).to.matchPattern({
      error: {
        type: 'MembershipPauseEndDateMustBeSameOrAfterStartDate',
        localized_title: 'Invalid dates',
        localized_message: 'Pause end date must be later than pause start date',
      },
    });

    await Membership.destroy({id: membership.id});

  });

  it('should fail if membership has been terminated', async () => {

    const membership = await Membership.create({
      client: testClientId,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      paid_until: '2020-05-31',
      status: 'ended',
    }).fetch();

    const {body: errorResponse} = await supertest(sails.hooks.http.app)
      .post(
        '/membership-pauses' +
        '?client=' + testClientId)
      .send(
        {
          start_date: '2020-06-13',
          end_date: '2020-06-14',
          membership: membership.id,
        },
      )
      .use(acceptExtendedErrorFormat())
      .use(authorizeAdmin())
      .expect(200);

    expect(errorResponse).to.matchPattern({
      error: {
        type: 'OnlyActiveMembershipsCanBePaused',
        localized_title: 'Membership is not active',
        localized_message: 'Only active memberships can be paused',
      },
    });

    await Membership.destroy({id: membership.id});

  });

  it('should fail if membership has been cancelled and is running', async () => {

    const membership = await Membership.create({
      client: testClientId,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      paid_until: '2020-05-31',
      status: 'cancelled_running',
      cancelled_from_date: '2020-07-01',
    }).fetch();

    const {body: errorResponse} = await supertest(sails.hooks.http.app)
      .post(
        '/membership-pauses' +
        '?client=' + testClientId)
      .send(
        {
          start_date: '2020-06-13',
          end_date: '2020-06-14',
          membership: membership.id,
        },
      )
      .use(acceptExtendedErrorFormat())
      .use(authorizeAdmin())
      .expect(200);

    expect(errorResponse).to.matchPattern({
      error: {
        type: 'OnlyActiveMembershipsCanBePaused',
        localized_title: 'Membership is not active',
        localized_message: 'Only active memberships can be paused',
      },
    });

    await Membership.destroy({id: membership.id});

  });

  it('should fail if membership already has an active membership pause', async () => {

    MockDate.set(moment.tz('2020-05-15', 'Europe/Copenhagen'));
    const membership = await Membership.create({
      client: testClientId,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      user: fixtures.userAlice.id,
      paid_until: '2020-05-31',
      status: 'active',
    }).fetch();

    const existingMembershipPause = await MembershipPause.create({
      client_id: testClientId,
      membership_id: membership.id,
      start_date: '2020-05-05',
      end_date: '2020-06-05',
    }).fetch();

    const {body: errorResponse} = await supertest(sails.hooks.http.app)
      .post(
        '/membership-pauses' +
        '?client=' + testClientId)
      .send(
        {
          start_date: '2020-06-13',
          end_date: '2020-06-14',
          membership: membership.id,
        },
      )
      .use(acceptExtendedErrorFormat())
      .use(authorizeAdmin())
      .expect(200);

    expect(errorResponse).to.matchPattern({
      error: {
        type: 'MembershipAlreadyPaused',
        localized_title: 'Membership is already paused',
        localized_message: 'Membership can not be paused because it already is paused.',
      },
    });

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: existingMembershipPause.id});

  });

  it('should fail if membership already has a scheduled membership pause', async () => {

    MockDate.set(moment.tz('2020-05-15', 'Europe/Copenhagen'));
    const membership = await Membership.create({
      client: testClientId,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      user: fixtures.userAlice.id,
      paid_until: '2020-05-31',
      status: 'active',
    }).fetch();

    const existingMembershipPause = await MembershipPause.create({
      client_id: testClientId,
      membership_id: membership.id,
      start_date: '2020-05-20',
      end_date: '2020-06-20',
    }).fetch();

    const {body: errorResponse} = await supertest(sails.hooks.http.app)
      .post(
        '/membership-pauses' +
        '?client=' + testClientId)
      .send(
        {
          start_date: '2020-06-13',
          end_date: '2020-06-14',
          membership: membership.id,
        },
      )
      .use(acceptExtendedErrorFormat())
      .use(authorizeAdmin())
      .expect(200);

    expect(errorResponse).to.matchPattern({
      error: {
        type: 'MembershipAlreadyHasPauseScheduled',
        localized_title: 'Membership already has pause scheduled',
        localized_message: 'Membership can not be paused because it already has a pause scheduled.',
      },
    });

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: existingMembershipPause.id});

  });

  it('should fail if new pause overlaps with existing latest pause', async () => {

    MockDate.set(moment.tz('2020-05-15', 'Europe/Copenhagen'));
    const membership = await Membership.create({
      client: testClientId,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      user: fixtures.userAlice.id,
      paid_until: '2020-05-31',
      status: 'active',
    }).fetch();

    const existingMembershipPause = await MembershipPause.create({
      client_id: testClientId,
      membership_id: membership.id,
      start_date: '2020-04-20',
      end_date: '2020-05-10',
    }).fetch();

    const {body: errorResponse} = await supertest(sails.hooks.http.app)
      .post(
        '/membership-pauses' +
        '?client=' + testClientId)
      .send(
        {
          start_date: '2020-05-09',
          end_date: '2020-05-10',
          membership: membership.id,
        },
      )
      .use(acceptExtendedErrorFormat())
      .use(authorizeAdmin())
      .expect(200);

    expect(errorResponse).to.matchPattern({
      error: {
        type: 'MembershipPauseOverlapsWithPreviousPause',
        localized_title: 'Membership pauses overlap',
        localized_message: 'Membership pause could not be created because it overlaps an existing membership pause.',
      },
    });

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: existingMembershipPause.id});

  });

  it('should fail if new pause (without end date) overlaps with existing latest pause', async () => {

    MockDate.set(moment.tz('2020-05-15', 'Europe/Copenhagen'));
    const membership = await Membership.create({
      client: testClientId,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      user: fixtures.userAlice.id,
      paid_until: '2020-05-31',
      status: 'active',
    }).fetch();

    const existingMembershipPause = await MembershipPause.create({
      client_id: testClientId,
      membership_id: membership.id,
      start_date: '2020-04-20',
      end_date: '2020-05-10',
    }).fetch();

    const {body: errorResponse} = await supertest(sails.hooks.http.app)
      .post(
        '/membership-pauses' +
        '?client=' + testClientId)
      .send(
        {
          start_date: '2020-05-09',
          membership: membership.id,
        },
      )
      .use(acceptExtendedErrorFormat())
      .use(authorizeAdmin())
      .expect(200);

    expect(errorResponse).to.matchPattern({
      error: {
        type: 'MembershipPauseOverlapsWithPreviousPause',
        localized_title: 'Membership pauses overlap',
        localized_message: 'Membership pause could not be created because it overlaps an existing membership pause.',
      },
    });

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: existingMembershipPause.id});

  });

  it('should succeed if new pause does not overlap with existing latest pause', async () => {

    MockDate.set(moment.tz('2020-05-15', 'Europe/Copenhagen'));
    const membership = await Membership.create({
      client: testClientId,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      user: fixtures.userAlice.id,
      paid_until: '2020-05-31',
      status: 'active',
    }).fetch();

    await MembershipPause.create({
      client_id: testClientId,
      membership_id: membership.id,
      start_date: '2020-04-09',
      end_date: '2020-05-09',
    }).fetch();

    await supertest(sails.hooks.http.app)
      .post(
        '/membership-pauses' +
        '?client=' + testClientId)
      .send(
        {
          start_date: '2020-05-09',
          end_date: '2020-06-10',
          membership: membership.id,
        },
      )
      .use(acceptExtendedErrorFormat())
      .use(authorizeAdmin())
      .expect(200);

    const MembershipPauseObjection = require('../../../../api/objection-models/MembershipPause');
    const membershipPauses = await MembershipPauseObjection.query();

    expect(membershipPauses).to.matchPattern(`[
    {
      membership_id: ${membership.id},
      start_date: '2020-04-09',
      end_date: '2020-05-09',
      ...
    },
    {
      membership_id: ${membership.id},
      start_date: '2020-05-09',
      end_date: '2020-06-10',
      ...
    }]`);

    const logEntries = await MembershipLog.find({});
    expect(logEntries).to.matchPattern(`[    
    {
      client: ${testClientId},
      membership: ${membership.id},
      entry: 'Membership paused from Saturday, May 9, 2020 to Wednesday, June 10, 2020. Comment: "". Admin user: Admin Adminson.',
      ...
    }
    ]`);

    await Membership.destroy({});
    await MembershipPause.destroy({});

  });

  it('should charge a fee', async () => {

    MockDate.set(moment.tz('2020-05-15', 'Europe/Copenhagen'));
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

    const timestampBeforeCall = Date.now();
    await supertest(sails.hooks.http.app)
      .post(
        '/membership-pauses' +
        '?client=' + testClientId)
      .send(
        {
          start_date: '2020-05-15',
          end_date: '2020-06-15',
          membership: membership.id,
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
    const createdMembershipPauses = await MembershipPauseObjection.query();

    expect(createdMembershipPauses).to.matchPattern(`[{
      membership_id: ${membership.id},
      start_date: '2020-05-15',
      end_date: '2020-06-15',
      fee: 100,
      fee_paid_with_order_id: ${createdOrders[0].id},
      ...
    }]`);


    const createdOrderItems = await OrderItem.find({});
    expect(createdOrderItems).to.matchPattern(`[{
      client: ${testClientId},
      order: ${createdOrders[0].id},
      name: 'Membership pause fee, Yoga Unlimited',
      item_type: 'membership_pause_fee',
      item_id: ${createdMembershipPauses[0].id},
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
      entry: 'Membership paused from Friday, May 15, 2020 to Monday, June 15, 2020. Comment: "". Admin user: Admin Adminson.',
      ...
    }
    ]`);

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: createdMembershipPauses[0].id});
    await PaymentSubscription.destroy({id: paymentSubscription.id});
    await Order.destroy({});
    await OrderItem.destroy({});

  });

  it('should fail if fee is declined', async () => {

    MockDate.set(moment.tz('2020-05-15', 'Europe/Copenhagen'));
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
      state: 'failed',
    });
    sinon.replace(sails.helpers.paymentProvider.reepay.api, 'request', chargeRequestFake);

    const timestampBeforeCall = Date.now();
    const {body: response} = await supertest(sails.hooks.http.app)
      .post(
        '/membership-pauses' +
        '?client=' + testClientId)
      .send(
        {
          start_date: '2020-05-15',
          membership: membership.id,
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
    const createdMembershipPauses = await MembershipPauseObjection.query();

    expect(createdMembershipPauses).to.matchPattern(`[{
      membership_id: ${membership.id},
      start_date: '2020-05-15',
      end_date: null,
      fee: 100,
      fee_paid_with_order_id: null,
      archived: 1,
      ...
    }]`);

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: createdMembershipPauses[0].id});
    await PaymentSubscription.destroy({id: paymentSubscription.id});
    await Order.destroy({});
    await OrderItem.destroy({});

  });

  it('should pause membership indefinitely', async () => {

    MockDate.set(moment.tz('2020-05-15', 'Europe/Copenhagen'));
    const membership = await Membership.create({
      client: testClientId,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      user: fixtures.userAlice.id,
      paid_until: '2020-05-31',
      status: 'active',
    }).fetch();

    await supertest(sails.hooks.http.app)
      .post(
        '/membership-pauses' +
        '?client=' + testClientId)
      .send(
        {
          start_date: '2020-05-15',
          membership: membership.id,
        },
      )
      .use(acceptExtendedErrorFormat())
      .use(authorizeAdmin())
      .expect(200);

    const MembershipPauseObjection = require('../../../../api/objection-models/MembershipPause');
    const createdMembershipPauses = await MembershipPauseObjection.query();

    expect(createdMembershipPauses).to.matchPattern(`[{
      membership_id: ${membership.id},
      start_date: '2020-05-15',
      end_date: null,
      ...
    }]`);


    const logEntries = await MembershipLog.find({});
    expect(logEntries).to.matchPattern(`[    
    {
      client: ${testClientId},
      membership: ${membership.id},
      entry: 'Membership paused from Friday, May 15, 2020 and indefinitely. Comment: "". Admin user: Admin Adminson.',
      ...
    }
    ]`);

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: createdMembershipPauses[0].id});

  });

  it('should schedule membership pause', async () => {

    MockDate.set(moment.tz('2020-05-15', 'Europe/Copenhagen'));
    const membership = await Membership.create({
      client: testClientId,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      user: fixtures.userAlice.id,
      paid_until: '2020-05-31',
      status: 'active',
    }).fetch();

    await supertest(sails.hooks.http.app)
      .post(
        '/membership-pauses' +
        '?client=' + testClientId)
      .send(
        {
          start_date: '2020-05-16',
          end_date: '2020-06-16',
          membership: membership.id,
        },
      )
      .use(acceptExtendedErrorFormat())
      .use(authorizeAdmin())
      .expect(200);

    const MembershipPauseObjection = require('../../../../api/objection-models/MembershipPause');
    const createdMembershipPauses = await MembershipPauseObjection.query();

    expect(createdMembershipPauses).to.matchPattern(`[{
      membership_id: ${membership.id},
      start_date: '2020-05-16',
      end_date: '2020-06-16',
      ...
    }]`);


    const logEntries = await MembershipLog.find({});
    expect(logEntries).to.matchPattern(`[    
    {
      client: ${testClientId},
      membership: ${membership.id},
      entry: 'Membership pause scheduled from Saturday, May 16, 2020 to Tuesday, June 16, 2020. Comment: "". Admin user: Admin Adminson.',
      ...
    }
    ]`);

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: createdMembershipPauses[0].id});

  });

  it('should schedule membership pause with no end date', async () => {

    MockDate.set(moment.tz('2020-05-15', 'Europe/Copenhagen'));
    const membership = await Membership.create({
      client: testClientId,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      user: fixtures.userAlice.id,
      paid_until: '2020-05-31',
      status: 'active',
    }).fetch();

    await supertest(sails.hooks.http.app)
      .post(
        '/membership-pauses' +
        '?client=' + testClientId)
      .send(
        {
          start_date: '2020-05-16',
          membership: membership.id,
        },
      )
      .use(acceptExtendedErrorFormat())
      .use(authorizeAdmin())
      .expect(200);

    const MembershipPauseObjection = require('../../../../api/objection-models/MembershipPause');
    const createdMembershipPauses = await MembershipPauseObjection.query();

    expect(createdMembershipPauses).to.matchPattern(`[{
      membership_id: ${membership.id},
      start_date: '2020-05-16',
      end_date: null,
      ...
    }]`);


    const logEntries = await MembershipLog.find({});
    expect(logEntries).to.matchPattern(`[    
    {
      client: ${testClientId},
      membership: ${membership.id},
      entry: 'Membership pause scheduled from Saturday, May 16, 2020 and indefinitely. Comment: "". Admin user: Admin Adminson.',
      ...
    }
    ]`);

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: createdMembershipPauses[0].id});

  });

  it('should save a comment and trim whitespace', async () => {

    MockDate.set(moment.tz('2020-05-15', 'Europe/Copenhagen'));
    const membership = await Membership.create({
      client: testClientId,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      user: fixtures.userAlice.id,
      paid_until: '2020-05-31',
      status: 'active',
    }).fetch();

    await supertest(sails.hooks.http.app)
      .post(
        '/membership-pauses' +
        '?client=' + testClientId)
      .send(
        {
          start_date: '2020-05-15',
          membership: membership.id,
          comment: ' Maternity leave ',
        },
      )
      .use(acceptExtendedErrorFormat())
      .use(authorizeAdmin())
      .expect(200);

    const MembershipPauseObjection = require('../../../../api/objection-models/MembershipPause');
    const createdMembershipPauses = await MembershipPauseObjection.query();

    expect(createdMembershipPauses).to.matchPattern(`[{
      membership_id: ${membership.id},
      start_date: '2020-05-15',
      end_date: null,
      comment: 'Maternity leave',
      ...
    }]`);


    const logEntries = await MembershipLog.find({});
    expect(logEntries).to.matchPattern(`[    
    {
      client: ${testClientId},
      membership: ${membership.id},
      entry: 'Membership paused from Friday, May 15, 2020 and indefinitely. Comment: "Maternity leave". Admin user: Admin Adminson.',
      ...
    }
    ]`);

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: createdMembershipPauses[0].id});

  });

  it('should fail if comment is too long', async () => {

    MockDate.set(moment.tz('2020-05-15', 'Europe/Copenhagen'));

    const membership = await Membership.create({
      client: testClientId,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      paid_until: '2020-05-31',
      status: 'active',
    }).fetch();

    await supertest(sails.hooks.http.app)
      .post(
        '/membership-pauses' +
        '?client=' + testClientId)
      .send(
        {
          start_date: '2020-05-15',
          end_date: '2020-06-15',
          membership: membership.id,
          comment: ' 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 ',
        },
      )
      .use(acceptExtendedErrorFormat())
      .use(authorizeAdmin())
      .expect(400);

    await Membership.destroy({id: membership.id});

  });

  it('should cancel future signups in the pause period', async () => {

    MockDate.set(moment.tz('2020-05-15 12:00:00', 'Europe/Copenhagen'));
    const membership = await Membership.create({
      client: testClientId,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      user: fixtures.userAlice.id,
      paid_until: '2020-05-31',
      status: 'active',
    }).fetch();

    const classes = await Class.createEach([
      {
        client: testClientId,
        date: '2020-05-14',
        start_time: '12:00:00',
        end_time: '14:00:00',
        class_type: fixtures.classTypeYoga.id,
      },
      {
        client: testClientId,
        date: '2020-05-15',
        start_time: '11:59:59',
        end_time: '14:00:00',
        class_type: fixtures.classTypeYoga.id,
      },
      {
        client: testClientId,
        date: '2020-05-15',
        start_time: '12:00:00',
        end_time: '14:00:00',
        class_type: fixtures.classTypeYoga.id,
      },
      {
        client: testClientId,
        date: '2020-05-16',
        start_time: '12:00:00',
        end_time: '14:00:00',
        class_type: fixtures.classTypeYoga.id,
      },
      {
        client: testClientId,
        date: '2020-06-14',
        start_time: '23:59:59',
        end_time: '02:00:00',
        class_type: fixtures.classTypeYoga.id,
      },
      {
        client: testClientId,
        date: '2020-05-15',
        start_time: '00:00:00',
        end_time: '02:00:00',
        class_type: fixtures.classTypeYoga.id,
      },
    ]).fetch();

    const classSignupsWithMembership = await ClassSignup.createEach(
      _.map(classes, c => ({
        client: testClientId,
        class: c.id,
        user: fixtures.userAlice.id,
        used_membership: membership.id,
      })),
    ).fetch();

    const classSignupNotWithMembership = await ClassSignup.create({
      client: testClientId,
      class: classes[3].id,
      user: fixtures.userAlice.id,
    }).fetch();

    const timestampBeforeCall = Date.now();
    await supertest(sails.hooks.http.app)
      .post(
        '/membership-pauses' +
        '?client=' + testClientId)
      .send(
        {
          start_date: '2020-05-15',
          end_date: '2020-06-15',
          membership: membership.id,
        },
      )
      .use(acceptExtendedErrorFormat())
      .use(authorizeAdmin())
      .expect(200);
    const timestampAfterCall = Date.now();

    const updatedClassSignupsWithMembership = await ClassSignup.find({id: _.map(classSignupsWithMembership, 'id')});
    expect(updatedClassSignupsWithMembership).to.matchPattern(`[
      {
        cancelled_at: 0,
        ...   
      },
      {
        cancelled_at: 0,
        ...   
      },
      {
        cancelled_at: _.isBetween|${timestampBeforeCall - 1}|${timestampAfterCall + 1},
        ...   
      },
      {
        cancelled_at: _.isBetween|${timestampBeforeCall - 1}|${timestampAfterCall + 1},
        ...   
      },
      {
        cancelled_at: _.isBetween|${timestampBeforeCall - 1}|${timestampAfterCall + 1},
        ...   
      },
      {
        cancelled_at: 0,
        ...   
      },
    ]`);

    const updatedClassSignupNotWithMembership = await ClassSignup.findOne(classSignupNotWithMembership.id);
    expect(updatedClassSignupNotWithMembership).to.matchPattern(`
    {
      cancelled_at: 0,
      ...
    }`);

    await Membership.destroy({});
    await MembershipPause.destroy({});
    await ClassSignup.destroy({});
    await Class.destroy({id: _.map(classes, 'id')});

  });

  it('should cancel future livestream signups in the pause period', async () => {

    MockDate.set(moment.tz('2020-05-15 12:00:00', 'Europe/Copenhagen'));
    const membership = await Membership.create({
      client: testClientId,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      user: fixtures.userAlice.id,
      paid_until: '2020-05-31',
      status: 'active',
    }).fetch();

    const classes = await Class.createEach([
      {
        client: testClientId,
        date: '2020-05-14',
        start_time: '12:00:00',
        end_time: '14:00:00',
        class_type: fixtures.classTypeYoga.id,
      },
      {
        client: testClientId,
        date: '2020-05-15',
        start_time: '11:59:59',
        end_time: '14:00:00',
        class_type: fixtures.classTypeYoga.id,
      },
      {
        client: testClientId,
        date: '2020-05-15',
        start_time: '12:00:00',
        end_time: '14:00:00',
        class_type: fixtures.classTypeYoga.id,
      },
      {
        client: testClientId,
        date: '2020-05-16',
        start_time: '12:00:00',
        end_time: '14:00:00',
        class_type: fixtures.classTypeYoga.id,
      },
      {
        client: testClientId,
        date: '2020-06-14',
        start_time: '23:59:59',
        end_time: '02:00:00',
        class_type: fixtures.classTypeYoga.id,
      },
      {
        client: testClientId,
        date: '2020-05-15',
        start_time: '00:00:00',
        end_time: '02:00:00',
        class_type: fixtures.classTypeYoga.id,
      },
    ]).fetch();

    const classSignupsWithMembership = await ClassLivestreamSignup.createEach(
      _.map(classes, c => ({
        client: testClientId,
        class: c.id,
        user: fixtures.userAlice.id,
        used_membership: membership.id,
      })),
    ).fetch();

    const classSignupNotWithMembership = await ClassLivestreamSignup.create({
      client: testClientId,
      class: classes[3].id,
      user: fixtures.userAlice.id,
    }).fetch();

    const timestampBeforeCall = Date.now();
    await supertest(sails.hooks.http.app)
      .post(
        '/membership-pauses' +
        '?client=' + testClientId)
      .send(
        {
          start_date: '2020-05-15',
          end_date: '2020-06-15',
          membership: membership.id,
        },
      )
      .use(acceptExtendedErrorFormat())
      .use(authorizeAdmin())
      .expect(200);
    const timestampAfterCall = Date.now();

    const updatedClassSignupsWithMembership = await ClassLivestreamSignup.find({id: _.map(classSignupsWithMembership, 'id')});
    expect(updatedClassSignupsWithMembership).to.matchPattern(`[
      {
        cancelled_at: 0,
        ...   
      },
      {
        cancelled_at: 0,
        ...   
      },
      {
        cancelled_at: _.isBetween|${timestampBeforeCall - 1}|${timestampAfterCall + 1},
        ...   
      },
      {
        cancelled_at: _.isBetween|${timestampBeforeCall - 1}|${timestampAfterCall + 1},
        ...   
      },
      {
        cancelled_at: _.isBetween|${timestampBeforeCall - 1}|${timestampAfterCall + 1},
        ...   
      },
      {
        cancelled_at: 0,
        ...   
      },
    ]`);

    const updatedClassSignupNotWithMembership = await ClassLivestreamSignup.findOne(classSignupNotWithMembership.id);
    expect(updatedClassSignupNotWithMembership).to.matchPattern(`
    {
      cancelled_at: 0,
      ...
    }`);

    await Membership.destroy({});
    await MembershipPause.destroy({});
    await ClassLivestreamSignup.destroy({});
    await Class.destroy({id: _.map(classes, 'id')});

  });

  it('should cancel future waiting list signups in the pause period', async () => {

    MockDate.set(moment.tz('2020-05-15 12:00:00', 'Europe/Copenhagen'));
    const membership = await Membership.create({
      client: testClientId,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      user: fixtures.userAlice.id,
      paid_until: '2020-05-31',
      status: 'active',
    }).fetch();

    const classes = await Class.createEach([
      {
        client: testClientId,
        date: '2020-05-14',
        start_time: '12:00:00',
        end_time: '14:00:00',
        class_type: fixtures.classTypeYoga.id,
      },
      {
        client: testClientId,
        date: '2020-05-15',
        start_time: '11:59:59',
        end_time: '14:00:00',
        class_type: fixtures.classTypeYoga.id,
      },
      {
        client: testClientId,
        date: '2020-05-15',
        start_time: '12:00:00',
        end_time: '14:00:00',
        class_type: fixtures.classTypeYoga.id,
      },
      {
        client: testClientId,
        date: '2020-05-16',
        start_time: '12:00:00',
        end_time: '14:00:00',
        class_type: fixtures.classTypeYoga.id,
      },
      {
        client: testClientId,
        date: '2020-06-14',
        start_time: '23:59:59',
        end_time: '02:00:00',
        class_type: fixtures.classTypeYoga.id,
      },
      {
        client: testClientId,
        date: '2020-05-15',
        start_time: '00:00:00',
        end_time: '02:00:00',
        class_type: fixtures.classTypeYoga.id,
      },
    ]).fetch();

    const classSignupsWithMembership = await ClassWaitingListSignup.createEach(
      _.map(classes, c => ({
        client: testClientId,
        class: c.id,
        user: fixtures.userAlice.id,
        used_membership: membership.id,
      })),
    ).fetch();

    const classSignupNotWithMembership = await ClassWaitingListSignup.create({
      client: testClientId,
      class: classes[3].id,
      user: fixtures.userAlice.id,
    }).fetch();

    const timestampBeforeCall = Date.now();
    await supertest(sails.hooks.http.app)
      .post(
        '/membership-pauses' +
        '?client=' + testClientId)
      .send(
        {
          start_date: '2020-05-15',
          end_date: '2020-06-15',
          membership: membership.id,
        },
      )
      .use(acceptExtendedErrorFormat())
      .use(authorizeAdmin())
      .expect(200);
    const timestampAfterCall = Date.now();

    const updatedClassSignupsWithMembership = await ClassWaitingListSignup.find({id: _.map(classSignupsWithMembership, 'id')});
    expect(updatedClassSignupsWithMembership).to.matchPattern(`[
      {
        cancelled_at: 0,
        ...   
      },
      {
        cancelled_at: 0,
        ...   
      },
      {
        cancelled_at: _.isBetween|${timestampBeforeCall - 1}|${timestampAfterCall + 1},
        ...   
      },
      {
        cancelled_at: _.isBetween|${timestampBeforeCall - 1}|${timestampAfterCall + 1},
        ...   
      },
      {
        cancelled_at: _.isBetween|${timestampBeforeCall - 1}|${timestampAfterCall + 1},
        ...   
      },
      {
        cancelled_at: 0,
        ...   
      },
    ]`);

    const updatedClassSignupNotWithMembership = await ClassWaitingListSignup.findOne(classSignupNotWithMembership.id);
    expect(updatedClassSignupNotWithMembership).to.matchPattern(`
    {
      cancelled_at: 0,
      ...
    }`);

    await Membership.destroy({});
    await MembershipPause.destroy({});
    await ClassWaitingListSignup.destroy({});
    await Class.destroy({id: _.map(classes, 'id')});

  });


});
