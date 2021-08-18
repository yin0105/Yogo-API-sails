const assert = require('assert')
const moment = require('moment-timezone')

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID
const fixtures = require('../../../fixtures/factory').fixtures

const comparePartialObject = require('../../../utils/compare-partial-object')

const MockDate = require('mockdate')
const sinon = require('sinon')
const supertest = require('supertest')

const apiRequestFake = require('../../../fakes/default-api-request-fake')

describe('controllers.Cron.tick', async () => {

  let
    memberships,
    paymentSubscriptions

  before(async () => {

    sinon.restore()

    MockDate.set(moment.tz('2019-05-16', 'Europe/Copenhagen'))

    memberships = await Membership.createEach([
      {
        paid_until: '2019-05-15',
        membership_type: fixtures.membershipTypeYogaUnlimited.id,
        user: fixtures.userAlice.id,
        client: testClientId,
        status: 'active',
        payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
      },
      {
        paid_until: '2019-04-10',
        membership_type: fixtures.membershipTypeYogaUnlimited.id,
        status: 'cancelled_running',
        cancelled_from_date: '2019-05-11',
        user: fixtures.userBill.id,
        client: testClientId,
        payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
      },
    ]).fetch()

    paymentSubscriptions = await PaymentSubscription.createEach([
      {
        membership: memberships[0].id,
        status: 'active',
        payment_service_provider: 'dibs'
      }, {
        membership: memberships[1].id,
        status: 'active',
        payment_service_provider: 'dibs'
      },
    ])

  })

  beforeEach(async () => {
    await CronLog.destroy({})
    emailSendFake = sinon.fake()
    emailSendFake.with = emailSendFake
    sinon.replace(sails.helpers.email, 'send', emailSendFake)
    apiRequestFake.replace()
  })

  afterEach(async () => {
    sinon.restore()
  })

  after(async () => {
    await Membership.destroy({id: _.map(memberships, 'id')})
    await PaymentSubscription.destroy({id: _.map(paymentSubscriptions, 'id')})
    await Order.destroy({})
    await PaymentSubscriptionTransaction.destroy({})
    MockDate.reset()
  })

  it('should return http 500 if any error happens', async () => {

    const fakeThrows = sinon.fake.throws(new Error('Test error'))

    sinon.replace(sails.helpers.memberships.findOne, 'thatNeedsToProcessPayment', fakeThrows)

    sinon.replace(sails.log, 'error', sinon.fake())

    await supertest(sails.hooks.http.app)
      .post(`/cron/tick`)
      .expect(500)

    sinon.restore()

  })

  it('should process a membership payment, but not do anything else', async () => {

    const pdfReceiptFake = sinon.fake.returns({filename: 'Test filename', pdfBuffer: Buffer.from('Test buffer')})
    pdfReceiptFake.with = pdfReceiptFake
    sinon.replace(sails.helpers.order, 'pdfReceipt', pdfReceiptFake)

    await supertest(sails.hooks.http.app)
      .post(`/cron/tick`)
      .expect(200)

    const updatedMemberships = await Membership.find({id: _.map(memberships, 'id')});
    const updatedMembershipsJson = _.map(updatedMemberships, m => m.toJSON())

    comparePartialObject(
      updatedMembershipsJson,
      [
        {
          status: 'active',
          paid_until: '2019-06-15',
        },
        {
          status: 'cancelled_running',
          paid_until: '2019-04-10',
        },
      ],
    )

  })


  it('should stop a cancelled membership, if there are no memberships that need processing', async () => {
    await supertest(sails.hooks.http.app)
      .post(`/cron/tick`)
      .expect(200)

    const updatedMemberships = await Membership.find({id: _.map(memberships, 'id')});
    const updatedMembershipsJson = _.map(updatedMemberships, m => m.toJSON());

    comparePartialObject(
      updatedMembershipsJson,
      [
        {
          status: 'active',
          paid_until: '2019-06-15',
        },
        {
          status: 'ended',
          paid_until: '2019-04-10',
        },
      ],
    )

  })

  it('should do nothing if there are no tasks due', async () => {
    await supertest(sails.hooks.http.app)
      .post(`/cron/tick`)
      .expect(200)

    const updatedMemberships = await Membership.find({id: _.map(memberships, 'id')});
    const updatedMembershipsJson = _.map(updatedMemberships, m => m.toJSON())

    comparePartialObject(
      updatedMembershipsJson,
      [
        {
          status: 'active',
          paid_until: '2019-06-15',
        },
        {
          status: 'ended',
          paid_until: '2019-04-10',
        },
      ],
    )

    const lastCronLog = (await CronLog.find({}).limit(1).sort('id DESC'))[0]

    assert.strictEqual(lastCronLog.entry, 'No action taken')

  })

})
