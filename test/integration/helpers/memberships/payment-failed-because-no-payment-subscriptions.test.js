const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID
const fixtures = require('../../../fixtures/factory').fixtures
const assert = require('assert')
const comparePartialObject = require('../../../utils/compare-partial-object')

const currencyDkk = require('../../../../api/filters/currency_dkk')
const moment = require('moment-timezone')

const emailSendFakeFactory = require('../../../fakes/email-send-fake-factory')
const sinon = require('sinon')

describe('helpers.memberships.payment-failed-because-no-payment-subscriptions', async () => {

  let
    emailSendFake,
    membership

  before(async () => {

    membership = await Membership.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
      status: 'active'
    }).fetch()

  })

  beforeEach(async () => {
    await MembershipLog.destroy({})
    emailSendFake = emailSendFakeFactory.installEmailSendFake()
  })

  afterEach(async () => {
    sinon.restore()
  })


  it('should update system and notify customer', async () => {

    await Membership.update({id: membership.id}, {renewal_failed: 3})

    await sails.helpers.memberships.paymentFailedBecauseNoPaymentSubscriptions(membership.id)

    const updatedMembership = await Membership.findOne(membership.id)

    comparePartialObject(
      updatedMembership,
      {
        id: membership.id,
        status: 'active',
        renewal_failed: 4,
      }
    )

    const now = moment().format('x')
    assert(updatedMembership.renewal_failed_last_time_at < now)
    assert(updatedMembership.renewal_failed_last_time_at > now - 1000)

    const createdMembershipLogEntry = await MembershipLog.find({})
    comparePartialObject(
      createdMembershipLogEntry,
      [{
        membership: membership.id,
        user: membership.user,
        client: membership.client,
        entry: `Fornyelse af medlemskab fejlede for 4. gang. Der kunne ikke trækkes ${currencyDkk(fixtures.yogaUnlimitedPaymentOptionMonthly.payment_amount)} kr. fordi der ikke er noget betalingskort.`,
      }]
    )

    expect(emailSendFake.firstCall.args[0]).to.matchPattern(`
      {
        user: {id: ${fixtures.userAlice.id}, ... },
        subject: 'Your membership will be cancelled tomorrow',
        ...
      }`
    )


  })


  it('should terminate membership if a certain number of attempts have been made', async () => {

    await Membership.update({id: membership.id}, {renewal_failed: 4})

    await sails.helpers.memberships.paymentFailedBecauseNoPaymentSubscriptions(membership.id)

    const updatedMembership = await Membership.findOne(membership.id)

    comparePartialObject(
      updatedMembership,
      {
        id: membership.id,
        status: 'ended',
        ended_because: 'payment_failed',
        renewal_failed: 5,
      }
    )

    const now = moment().format('x')
    assert(updatedMembership.renewal_failed_last_time_at < now)
    assert(updatedMembership.renewal_failed_last_time_at > now - 1000)

    const createdMembershipLogEntry = await MembershipLog.find({})
    comparePartialObject(
      createdMembershipLogEntry,
      [{
        membership: membership.id,
        user: membership.user,
        client: membership.client,
        entry: `Fornyelse af medlemskab fejlede for 5. gang. Der kunne ikke trækkes ${currencyDkk(fixtures.yogaUnlimitedPaymentOptionMonthly.payment_amount)} kr. fordi der ikke er noget betalingskort. Fornyelse er fejlet 5 gange og medlemskabet er nu afsluttet.`,
      }]
    )

    expect(emailSendFake.firstCall.args[0]).to.matchPattern(
      `{
        user: {id: ${fixtures.userAlice.id}, ... },
        subject: 'Your membership has been cancelled',
        ...
      }`
    )
  })

})
