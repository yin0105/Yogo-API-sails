const assert = require('assert')
const moment = require('moment-timezone')

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID
const fixtures = require('../../../fixtures/factory').fixtures

const comparePartialObject = require('../../../utils/compare-partial-object')

const MockDate = require('mockdate')
const sinon = require('sinon')

const apiRequestFakeFactory = require('../../../fakes/default-api-request-fake')


describe('helpers.memberships.process-one-membership-payment', async () => {

  let membership,
    paymentSubscription,
    pdfReceiptFake

  beforeEach(async () => {
    await ClientSettings.destroy({});
  })

  before(async () => {

    MockDate.set(moment.tz('2019-05-16 12:00:00', 'Europe/Copenhagen'))

    membership = await Membership.create({
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
      user: fixtures.userAlice.id,
      status: 'active',
      client: testClientId,
    }).fetch()

    paymentSubscription = await PaymentSubscription.create({
      membership: membership.id,
      status: 'active',
      payment_service_provider: 'dibs'
    }).fetch()

    pdfReceiptFake = sinon.fake.returns({filename: 'Test filename', pdfBuffer: Buffer.from('Test')})
    pdfReceiptFake.with = pdfReceiptFake
    sinon.replace(sails.helpers.order, 'pdfReceipt', pdfReceiptFake)

  })

  after(async () => {
    MockDate.reset()
    await Membership.destroy({id: membership.id})
    await PaymentSubscription.destroy({id: paymentSubscription.id})

    sinon.restore()
  })

  it('should return a processed membership', async () => {

    apiRequestFakeFactory.replace()

    await Membership.update({id: membership.id}, {
      paid_until: '2019-05-15',
    })

    const didProcessMembership = await sails.helpers.memberships.processOneMembershipPayment()

    assert(didProcessMembership === membership.id)

    const updatedMembership = await Membership.findOne(membership.id)

    assert.strictEqual(
      moment(updatedMembership.paid_until).tz('Europe/Copenhagen').format('YYYY-MM-DD'),
      '2019-06-15'
    )

    sinon.restore()

    await Order.destroy({})
    await PaymentSubscriptionTransaction.destroy({})

  })

  it('should return false if there is no membership to process', async () => {
    await Membership.update({id: membership.id}, {
      paid_until: '2019-05-16',
    })

    assert.strictEqual(
      await sails.helpers.memberships.processOneMembershipPayment(),
      false,
    )
  })

  it('should return false if the membership to be processed are processed by another thread', async () => {
    await Membership.update({id: membership.id}, {
      paid_until: '2019-05-15',
    })

    const membershipPaymentShouldStillBeProcessedFake = sinon.fake.returns(false)

    sinon.replace(
      sails.helpers.memberships,
      'membershipPaymentShouldStillBeProcessed',
      membershipPaymentShouldStillBeProcessedFake
    )

    assert.strictEqual(
      await sails.helpers.memberships.processOneMembershipPayment(),
      false,
    )

    assert.strictEqual(
      membershipPaymentShouldStillBeProcessedFake.callCount,
      1,
    )

    comparePartialObject(
      membershipPaymentShouldStillBeProcessedFake.firstCall.args[0],
      {
        id: membership.id,
      },
    )

    sinon.restore()
  })

})
