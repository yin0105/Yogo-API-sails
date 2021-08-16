const testClientId = require('../../../../global-test-variables').TEST_CLIENT_ID
const fixtures = require('../../../../fixtures/factory').fixtures
const sinon = require('sinon')
const emailSendFakeFactory = require('../../../../fakes/email-send-fake-factory')


describe('helpers.email.customer.customer-reactivated-cancelled-membership', async () => {

  let emailSendFake

  beforeEach(async () => {
    emailSendFake = emailSendFakeFactory.installEmailSendFake()
  })

  afterEach(() => {
    sinon.restore()
  })

  it('should send an email about the re-activated membership in English', async () => {

    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2016-06-15',
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'cancelled_running',
      cancelled_from_date: '2016-07-16',
      client: testClientId,
      payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
    }).fetch()

    await sails.helpers.email.customer.customerReactivatedCancelledMembership(membership)

    expect(emailSendFake.firstCall.args[0]).to.matchPattern(`
      {
        user: {id: ${fixtures.userAlice.id}, ... },
        subject: 'You have re-activated your Yoga Unlimited membership',
        text: 'Dear Alice,\\n\\nYou have re-activated your Yoga Unlimited membership.\\n\\nThe membership is now active and the next payment for 300 kr. will be drawn from your payment card Thursday, June 16, 2016.\\n\\nKind regards,\\nTest client',
        blindCopyToClient: true,
        emailType: 'customer_reactivated_cancelled_membership'
      }`
    )

    await Membership.destroy({id: membership.id})

  })

  it('should send an email about the re-activated membership in Danish', async () => {

    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'locale',
      value: 'da'
    }).fetch()

    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2016-06-15',
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'cancelled_running',
      cancelled_from_date: '2016-07-16',
      client: testClientId,
      payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
    }).fetch()

    await sails.helpers.email.customer.customerReactivatedCancelledMembership(membership)

    expect(emailSendFake.firstCall.args[0]).to.matchPattern(`
      {
        user: {id: ${fixtures.userAlice.id}, ... },
        subject: 'Du har genoptaget dit medlemskab Yoga Unlimited',
        text: 'Kære Alice\\n\\nDu har genoptaget dit medlemskab Yoga Unlimited.\\n\\nMedlemskabet er hermed aktivt igen og næste betaling på 300 kr. bliver trukket på dit betalingskort torsdag d. 16. juni 2016.\\n\\nVenlig hilsen\\nTest client',
        blindCopyToClient: true,
        emailType: 'customer_reactivated_cancelled_membership' 
      }`
    )

    await Membership.destroy({id: membership.id})
    await ClientSettings.destroy({id: clientSettingsRow.id})

  })

  it('should send a copy to client, if client has selected that', async () => {

    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'email_bcc_to_client_on_customer_cancel_or_resume_membership',
      value: 1,
    }).fetch()

    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2016-06-15',
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'cancelled_running',
      cancelled_from_date: '2016-07-16',
      client: testClientId,
      payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
    }).fetch()

    await sails.helpers.email.customer.customerReactivatedCancelledMembership(membership)

    expect(emailSendFake.firstCall.args[0]).to.matchPattern(`{
        user: {id: ${fixtures.userAlice.id}, ... },
        subject: 'You have re-activated your Yoga Unlimited membership',
        ...
      }`
    )

    await Membership.destroy({id: membership.id})
    await ClientSettings.destroy({id: clientSettingsRow.id})

  })

})
