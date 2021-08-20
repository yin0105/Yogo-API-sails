const testClientId = require('../../../../global-test-variables').TEST_CLIENT_ID
const fixtures = require('../../../../fixtures/factory').fixtures
const emailSendFakeFactory = require('../../../../fakes/email-send-fake-factory')
const sinon = require('sinon')

describe('helpers.email.customer.membership-renewal-failed', async () => {

  let membership,
    emailSendFake

  before(async () => {
    membership = await Membership.create({
      user: fixtures.userAlice.id,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      client: testClientId,
      payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
      paid_until: '2019-05-16',
      renewal_failed: 1,
    }).fetch()

  })

  beforeEach(async () => {
    emailSendFake = emailSendFakeFactory.installEmailSendFake()
    await ClientSettings.destroy({})
  })

  afterEach(async () => {
    sinon.restore()
    await PaymentSubscription.destroy({})
  })

  after(async () => {

  })


  it('should send an email about a failed membership renewal due to declined payment', async () => {

    await PaymentSubscription.create({
      membership: membership.id,
      status: 'active',
      client: testClientId,
    }).fetch()

    await sails.helpers.email.customer.membershipRenewalFailed(membership)


    expect(emailSendFake.firstCall.args[0]).to.matchPattern(`
      {
        user: {id: ${fixtures.userAlice.id}, ... },
        subject: 'We could not renew your membership',
        text: 'Dear Alice,\\n\\nWe tried to renew your membership Yoga Unlimited by withdrawing 300,00 on your payment card.\\n\\nThe payment was declined. Please log in to your profile and specify another payment card. You can also try the payment again with the current payment card.\\n\\nYou can log in by following this link: https://test-client.yogo.dk/frontend/index.html#/membership/${membership.id}\\n\\nKind regards,\\nTest client',        
        emailType: 'membership_renewal_failed',
        blindCopyToClient: true
      }`
    )

  })

  it('should send an email about a failed membership renewal due to missing payment subscription', async () => {
    await sails.helpers.email.customer.membershipRenewalFailed(membership)

    expect(emailSendFake.firstCall.args[0]).to.matchPattern(`
      {
        user: {id: ${fixtures.userAlice.id}, ... },
        subject: 'We could not renew your membership',
        text: 'Dear Alice,\\n\\nWe tried to renew your membership Yoga Unlimited but there is currently no payment card associated with your membership. Please log in to your profile and specify another payment card.\\n\\nYou can log in by following this link: https://test-client.yogo.dk/frontend/index.html#/membership/${membership.id}\\n\\nKind regards,\\nTest client',
        emailType: 'membership_renewal_failed',
        blindCopyToClient: true
      }`
    )
  })

  it('should send an email about a failed membership renewal due to declined payment, last notice', async () => {

    await PaymentSubscription.create({
      membership: membership.id,
      client: testClientId,
      status: 'active',
    }).fetch()

    await Membership.update({id: membership.id}, {
      renewal_failed: 4,
    })

    await sails.helpers.email.customer.membershipRenewalFailed(membership)

    expect(emailSendFake.firstCall.args[0]).to.matchPattern(`
      {
        user: {id: ${fixtures.userAlice.id}, ... },
        subject: 'Your membership will be cancelled tomorrow',
        ...
      }`
    )


  })

  it('should send an email about a failed membership renewal due to no payment option, last notice', async () => {

    await Membership.update({id: membership.id}, {
      renewal_failed: 4,
    })

    await sails.helpers.email.customer.membershipRenewalFailed(membership)

    expect(emailSendFake.firstCall.args[0]).to.matchPattern(`
      {
        user: {id: ${fixtures.userAlice.id}, ... },
        subject: 'Your membership will be cancelled tomorrow',
        text: 'Dear Alice,\\n\\nTomorrow we will try one final time to withdraw 300,00 on your payment card to renew your membership Yoga Unlimited. If there is still no payment card associated with your membership tomorrow, your membership will be cancelled.\\n\\nYou can log in and specify a payment card here: https://test-client.yogo.dk/frontend/index.html#/membership/${membership.id}\\n\\nKind regards,\\nTest client',
        emailType: 'membership_renewal_failed',
        blindCopyToClient: true
      }`
    )

  })

  it('should send an email about a failed membership renewal due to declined payment, membership terminated', async () => {

    const paymentSubscription = await PaymentSubscription.create({
      membership: membership.id,
      client: testClientId,
      status: 'active',
    }).fetch()

    await Membership.update({id: membership.id}, {
      renewal_failed: 5,
    })

    await sails.helpers.email.customer.membershipRenewalFailed(membership)

    expect(emailSendFake.firstCall.args[0]).to.matchPattern(`
      {
        user: {id: ${fixtures.userAlice.id}, ... },
        subject: 'Your membership has been cancelled',
        ...
      }`
    )

    await PaymentSubscription.destroy({id: paymentSubscription.id})

  })

  it('should send an email about a failed membership renewal due to no payment method, membership terminated', async () => {

    await Membership.update({id: membership.id}, {
      renewal_failed: 5,
    })

    await sails.helpers.email.customer.membershipRenewalFailed(membership)

    expect(emailSendFake.firstCall.args[0]).to.matchPattern(`
      {
        user: {id: ${fixtures.userAlice.id}, ... },
        subject: 'Your membership has been cancelled',
        text: 'Dear Alice,\\n\\nWe have tried to renew your membership Yoga Unlimited.\\n\\nThere is no payment card associated with your membership. We have tried to renew your membership several times and your membership has therefore now been cancelled.\\n\\nKind regards,\\nTest client',
        emailType: 'membership_renewal_failed',
        blindCopyToClient: true
      }`
    )

  })

  it('should not send a copy to client if client has unselected that', async () => {

    await Membership.update({id: membership.id}, {
      renewal_failed: 5,
    })

    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'email_bcc_to_client_on_membership_renewal_failed',
      value: 0,
    }).fetch()

    await sails.helpers.email.customer.membershipRenewalFailed(membership)

    expect(emailSendFake.firstCall.args[0]).to.matchPattern(`{
        user: {id: ${fixtures.userAlice.id}, ... },
        subject: 'Your membership has been cancelled',
        blindCopyToClient: false,
        ...
      }`
    )

    await ClientSettings.destroy({id: clientSettingsRow.id})

  })


})
