const testClientId = require('../../../../global-test-variables').TEST_CLIENT_ID
const fixtures = require('../../../../fixtures/factory').fixtures
const sinon = require('sinon')
const emailSendFakeFactory = require('../../../../fakes/email-send-fake-factory')

describe('helpers.email.customer.class-waiting-list-signup-converted-to-class-signup', async () => {

  let emailSendFake

  beforeEach(async () => {
    emailSendFake = emailSendFakeFactory.installEmailSendFake()
  })

  afterEach(() => {
    sinon.restore()
  })

  it('should send an email in English about the converted signup', async () => {

    const classItem = await Class.create({
      date: '2020-02-24',
      start_time: '10:00:00',
      end_time: '12:00:00',
      client: testClientId,
      class_type: fixtures.classTypeYoga.id,
    }).fetch()

    const waitingListSignup = await ClassWaitingListSignup.create({
      'class': classItem.id,
      user: fixtures.userAlice.id,
      client: testClientId,
    }).fetch()

    await sails.helpers.email.customer.classWaitingListSignupConvertedToClassSignup(waitingListSignup)

    expect(emailSendFake.firstCall.args[0]).to.matchPattern(`
      {        
        user: {id: ${fixtures.userAlice.id}, ... },
        subject: 'You are now signed up for Yoga, Monday, February 24, 2020 at 10:00',
        text: 'Dear Alice,\\n\\nYou are now signed up for Yoga, Monday, February 24, 2020 at 10:00, which you were on the waitlist for.\\n\\nWe are looking forward to see you.\\n\\nKind regards,\\nTest client',
        blindCopyToClient: false,
        emailType: 'customer_moved_from_waiting_list_to_signup'
      }`
    )

    await ClassWaitingListSignup.destroy({id: waitingListSignup.id})
    await Class.destroy({id: classItem.id})

  })

  it('should send an email in Danish about the converted signup', async () => {

    const classItem = await Class.create({
      date: '2020-02-24',
      start_time: '10:00:00',
      end_time: '12:00:00',
      client: testClientId,
      class_type: fixtures.classTypeYoga.id,
    }).fetch()

    const waitingListSignup = await ClassWaitingListSignup.create({
      'class': classItem.id,
      user: fixtures.userAlice.id,
      client: testClientId,
    }).fetch()

    const clientSettingsRow = await ClientSettings.create({
      key: 'locale',
      value: 'da',
      client: testClientId
    }).fetch()

    await sails.helpers.email.customer.classWaitingListSignupConvertedToClassSignup(waitingListSignup)

    expect(emailSendFake.firstCall.args[0]).to.matchPattern(`
      {        
        user: {id: ${fixtures.userAlice.id}, ...},
        subject: 'Du er nu tilmeldt Yoga, mandag d. 24. februar 2020 kl. 10:00',
        text: 'Kære Alice\\n\\nDu er nu tilmeldt Yoga, mandag d. 24. februar 2020 kl. 10:00, som du stod på venteliste til.\\n\\nVi glæder os til at se dig!\\n\\nVenlig hilsen\\nTest client',
        blindCopyToClient: false,
        emailType: 'customer_moved_from_waiting_list_to_signup'
      }`
    )

    await ClassWaitingListSignup.destroy({id: waitingListSignup.id})
    await Class.destroy({id: classItem.id})
    await ClientSettings.destroy({id: clientSettingsRow.id})

  })

  it('should send a copy to client, if client has selected that', async () => {

    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'email_bcc_to_client_on_customer_moved_from_waiting_list_to_class',
      value: 1
    }).fetch()

    const classItem = await Class.create({
      date: '2020-02-24',
      start_time: '10:00:00',
      end_time: '12:00:00',
      client: testClientId,
      class_type: fixtures.classTypeYoga.id,
    }).fetch()

    const waitingListSignup = await ClassWaitingListSignup.create({
      'class': classItem.id,
      user: fixtures.userAlice.id,
      client: testClientId,
    }).fetch()

    await sails.helpers.email.customer.classWaitingListSignupConvertedToClassSignup(waitingListSignup)

    expect(emailSendFake.firstCall.args[0]).to.matchPattern(`
      {
        user: {id: ${fixtures.userAlice.id}, ...},
        subject: 'You are now signed up for Yoga, Monday, February 24, 2020 at 10:00',
        text: 'Dear Alice,\\n\\nYou are now signed up for Yoga, Monday, February 24, 2020 at 10:00, which you were on the waitlist for.\\n\\nWe are looking forward to see you.\\n\\nKind regards,\\nTest client',
        blindCopyToClient: true,
        emailType: 'customer_moved_from_waiting_list_to_signup'
      }`
    )

    await ClassWaitingListSignup.destroy({id: waitingListSignup.id})
    await Class.destroy({id: classItem.id})
    await ClientSettings.destroy({id: clientSettingsRow.id})

  })

})
