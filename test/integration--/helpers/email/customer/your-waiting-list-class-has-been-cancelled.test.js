const testClientId = require('../../../../global-test-variables').TEST_CLIENT_ID
const fixtures = require('../../../../fixtures/factory').fixtures
const sinon = require('sinon')
const emailSendFakeFactory = require('../../../../fakes/email-send-fake-factory')

describe('helpers.email.customer.your-waiting-list-class-has-been-cancelled', async () => {

  let emailSendFake

  beforeEach(async () => {
    await ClientSettings.destroy({});
    emailSendFake = emailSendFakeFactory.installEmailSendFake()
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should send an email in English', async () => {
    
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

    await sails.helpers.email.customer.yourWaitingListClassHasBeenCancelled(waitingListSignup)

    expect(emailSendFake.firstCall.args[0]).to.matchPattern(`
      {
        user: {id: ${fixtures.userAlice.id}, ...},
        subject: 'CANCELLED: Yoga, Monday, February 24, 2020 at 10:00',
        text: 'Dear Alice,\\n\\nUnfortunately, we have to cancel Yoga, Monday, February 24, 2020 at 10:00, which you are on the waitlist for.\\n\\nIf you used a class pass with a fixed number of classes to sign up, the class has been returned.\\n\\nKind regards,\\nTest client',
        blindCopyToClient: false,
        emailType: 'your_waiting_list_class_has_been_cancelled'
      }`
    )

    await ClassWaitingListSignup.destroy({id: waitingListSignup.id})
    await Class.destroy({id: classItem.id})

  })

  it('should send an email in Danish', async () => {

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
      client: testClientId,
    }).fetch()

    await sails.helpers.email.customer.yourWaitingListClassHasBeenCancelled(waitingListSignup)

    expect(emailSendFake.firstCall.args[0]).to.matchPattern(`
      {
        user: {id: ${fixtures.userAlice.id}, ...},
        subject: 'AFLYST: Yoga, mandag d. 24. februar 2020 kl. 10:00',
        text: 'Kære Alice\\n\\nVi må desværre aflyse Yoga, mandag d. 24. februar 2020 kl. 10:00, som du står på venteliste til.\\n\\nHvis du brugte et klippekort til at tilmelde dig, har du fået dit klip tilbage.\\n\\nVenlig hilsen\\nTest client',
        blindCopyToClient: false,
        emailType: 'your_waiting_list_class_has_been_cancelled'
      }`
    )

    await ClassWaitingListSignup.destroy({id: waitingListSignup.id})
    await Class.destroy({id: classItem.id})
    await ClientSettings.destroy({id: clientSettingsRow.id})

  })

  it('should send a copy to client if client has selected that', async () => {

    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'email_bcc_to_client_on_class_cancelled',
      value: 1,
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

    await sails.helpers.email.customer.yourWaitingListClassHasBeenCancelled(waitingListSignup)

    expect(emailSendFake.firstCall.args[0]).to.matchPattern(`
      {
        user: {id: ${fixtures.userAlice.id}, ...},
        subject: 'CANCELLED: Yoga, Monday, February 24, 2020 at 10:00',
        blindCopyToClient: true,
        ...
      }`,
    )

    await ClassWaitingListSignup.destroy({id: waitingListSignup.id})
    await Class.destroy({id: classItem.id})
    await ClientSettings.destroy({id: clientSettingsRow.id})

  })


})
