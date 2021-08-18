const supertest = require('supertest')
const sinon = require('sinon');
const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID
const fixtures = require('../../../fixtures/factory').fixtures
const pdfReceiptFakeFactory = require('../../../fakes/pdf-receipt-fake-factory');
const emailSendFakeFactory = require('../../../fakes/email-send-fake-factory');
const moment = require('moment-timezone');

describe('controllers.ReepayPayments.webhook', async () => {

  let pdfReceiptFake,
  emailSendFake;

  beforeEach(async () => {
    pdfReceiptFake = pdfReceiptFakeFactory.installPdfReceiptFake();
    emailSendFake = emailSendFakeFactory.installEmailSendFake();
  })

  afterEach(async () => {
    sinon.restore();
  })

  it('should fail if invoice id is invalid', async () => {
    await supertest(sails.hooks.http.app)
      .post(
        '/payments/reepay/webhook',
      )
      .send({
        id: 'webhookId',
        timestamp: moment().toISOString(),
        signature: '',
        invoice: '99999999',
        customer: fixtures.userAlice.id,
        transaction: '',
        event_type: 'invoice_settled',
        event_id: 'dafba2016614418f969fa5697383e47c'
      })
      .expect(400);
  })

  it('should fail if user does not match invoice', async () => {

    const order = await Order.create({
      client: testClientId,
      user: fixtures.userBill.id,
    }).fetch();

    await supertest(sails.hooks.http.app)
      .post(
        '/payments/reepay/webhook',
      )
      .send({
        id: 'webhookId',
        timestamp: moment().toISOString(),
        signature: '',
        invoice: order.id.toString(),
        customer: fixtures.userAlice.id,
        transaction: 'transactionId',
        event_type: 'invoice_settled',
        event_id: 'dafba2016614418f969fa5697383e47c'
      })
      .expect(400);

  })

  it('should fail if user does not match invoice (email as user handle)', async () => {

    const order = await Order.create({
      client: testClientId,
      non_user_email: 'testname@yogo.dk',
      non_user_name: 'Test name',
    }).fetch();

    await supertest(sails.hooks.http.app)
      .post(
        '/payments/reepay/webhook',
      )
      .send({
        id: 'webhookId',
        timestamp: moment().toISOString(),
        signature: '',
        invoice: order.id.toString(),
        customer: 'testname2@yogo.dk',
        transaction: 'transactionId',
        event_type: 'invoice_settled',
        event_id: 'dafba2016614418f969fa5697383e47c'
      })
      .expect(400);

  })

  it('should fail if order has no user (just in case)', async () => {

    const order = await Order.create({
      client: testClientId,
    }).fetch();

    await supertest(sails.hooks.http.app)
      .post(
        '/payments/reepay/webhook',
      )
      .send({
        id: 'webhookId',
        timestamp: moment().toISOString(),
        signature: '',
        invoice: order.id.toString(),
        customer: 'testname2@yogo.dk',
        transaction: 'transactionId',
        event_type: 'invoice_settled',
        event_id: 'dafba2016614418f969fa5697383e47c'
      })
      .expect(400);

  })

  it('should fail if signature is invalid', async () => {

    const order = await Order.create({
      client: testClientId,
      user: fixtures.userAlice.id,
    }).fetch();

    await supertest(sails.hooks.http.app)
      .post(
        '/payments/reepay/webhook',
      )
      .send({
        id: 'webhookId',
        timestamp: moment().toISOString(),
        signature: 'abcdefg',
        invoice: order.id.toString(),
        customer: fixtures.userAlice.id,
        transaction: 'transactionId',
        event_type: 'invoice_settled',
        event_id: 'dafba2016614418f969fa5697383e47c'
      })
      .expect(400);

  })

  it('should process an order that has been paid', async () => {

    const order = await Order.create({
      client: testClientId,
      user: fixtures.userAlice.id,
    }).fetch();

    const webhookTimestamp = '2015-06-25T12:10:00.64Z';
    const webhookId = "abcdefg-hijkl-mnopq-rstuvxyz";
    const transactionId = "28b1af53d7ecd1c487292402a908e2b3";

    const signature = await sails.helpers.paymentProvider.reepay.webhook.calculateSignature.with({
      client: testClientId,
      timestamp: webhookTimestamp,
      id: webhookId,
    });

    const chargeRequestFake = sinon.fake.resolves({
      state: 'settled',
      source: {
        masked_card: '457123XXXXXX1234',
        exp_date: '05-20',
      },
    });
    sinon.replace(sails.helpers.paymentProvider.reepay.api, 'request', chargeRequestFake)

    const timestampBeforeCall = Date.now();
    await supertest(sails.hooks.http.app)
      .post(
        '/payments/reepay/webhook',
      )
      .send({
        id: webhookId,
        timestamp: webhookTimestamp.toString(),
        signature,
        invoice: order.id.toString(),
        customer: fixtures.userAlice.id,
        transaction: transactionId,
        event_type: 'invoice_settled',
        event_id: 'dafba2016614418f969fa5697383e47c'
      })
      .expect(200);

    const timestampAfterCall = Date.now()

    const updatedOrder = await Order.findOne(order.id);
    expect(updatedOrder).to.matchPattern(`{
      paid: _.isBetween|${timestampBeforeCall-1}|${timestampAfterCall},
      ...
    }`);

    expect(pdfReceiptFake.callCount).to.equal(1);
    expect(pdfReceiptFake.getCall(0).args[0].id).to.equal(order.id);

    await Order.destroy({id: order.id});
    sinon.restore();

  })

  it('should process a gift card order that has been paid (email as user handle)', async () => {

    const order = await Order.create({
      client: testClientId,
      non_user_email: 'testname@yogo.dk',
      non_user_name: 'Test name',
    }).fetch();

    const webhookTimestamp = '2015-06-25T12:10:00.64Z';
    const webhookId = "abcdefg-hijkl-mnopq-rstuvxyz";
    const transactionId = "28b1af53d7ecd1c487292402a908e2b3";

    const signature = await sails.helpers.paymentProvider.reepay.webhook.calculateSignature.with({
      client: testClientId,
      timestamp: webhookTimestamp,
      id: webhookId,
    });

    const chargeRequestFake = sinon.fake.resolves({
      state: 'settled',
      source: {
        masked_card: '457123XXXXXX1234',
        exp_date: '05-20',
      },
    });
    sinon.replace(sails.helpers.paymentProvider.reepay.api, 'request', chargeRequestFake)

    const timestampBeforeCall = Date.now();
    await supertest(sails.hooks.http.app)
      .post(
        '/payments/reepay/webhook',
      )
      .send({
        id: webhookId,
        timestamp: webhookTimestamp.toString(),
        signature,
        invoice: order.id.toString(),
        customer: 'testname@yogo.dk',
        transaction: transactionId,
        event_type: 'invoice_settled',
        event_id: 'dafba2016614418f969fa5697383e47c'
      })
      .expect(200);

    const timestampAfterCall = Date.now()

    const updatedOrder = await Order.findOne(order.id);
    expect(updatedOrder).to.matchPattern(`{
      paid: _.isBetween|${timestampBeforeCall-1}|${timestampAfterCall},
      ...
    }`);

    expect(pdfReceiptFake.callCount).to.equal(1);
    expect(pdfReceiptFake.getCall(0).args[0].id).to.equal(order.id);

    await Order.destroy({id: order.id});
    sinon.restore();

  })

  it('should ignore any event_types but "invoice_settled" and "invoice_authorized"', async () => {

    const order = await Order.create({
      client: testClientId,
      user: fixtures.userAlice.id,
    }).fetch();

    const webhookTimestamp = '2015-06-25T12:10:00.64Z';
    const webhookId = "abcdefg-hijkl-mnopq-rstuvxyz";
    const transactionId = "28b1af53d7ecd1c487292402a908e2b3";

    const signature = await sails.helpers.paymentProvider.reepay.webhook.calculateSignature.with({
      client: testClientId,
      timestamp: webhookTimestamp,
      id: webhookId,
    });

    await supertest(sails.hooks.http.app)
      .post(
        '/payments/reepay/webhook',
      )
      .send({
        id: webhookId,
        timestamp: webhookTimestamp.toString(),
        signature,
        invoice: order.id.toString(),
        customer: fixtures.userAlice.id,
        transaction: transactionId,
        event_type: 'dummy_event_type',
        event_id: 'dafba2016614418f969fa5697383e47c'
      })
      .expect(200);

    const updatedOrder = await Order.findOne(order.id);
    expect(updatedOrder).to.matchPattern(`{
      paid: 0,
      ...
    }`);

    expect(pdfReceiptFake.callCount).to.equal(0);
    expect(emailSendFake.callCount).to.equal(0);

    await Order.destroy({id: order.id});
    sinon.restore();

  })



})
