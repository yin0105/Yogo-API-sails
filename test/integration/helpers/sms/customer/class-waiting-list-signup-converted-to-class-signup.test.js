const testClientId = require('../../../../global-test-variables').TEST_CLIENT_ID
const fixtures = require('../../../../fixtures/factory').fixtures
const sinon = require('sinon')

describe('helpers.sms.customer.class-waiting-list-signup-converted-to-class-signup', async () => {

  let smsSendFake

  beforeEach(async () => {
    smsSendFake = sinon.fake()
    smsSendFake.with = smsSendFake
    sinon.replace(sails.helpers.sms, 'send', smsSendFake)
  })

  afterEach(() => {
    sinon.restore()
  })

  it('should send an sms in English about the converted signup', async () => {

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

    await sails.helpers.sms.customer.classWaitingListSignupConvertedToClassSignup(waitingListSignup)

    expect(smsSendFake.firstCall.args[0]).to.matchPattern(`
      {
        user: {
          id: ${fixtures.userAlice.id},
          ...
        },
        message: "Dear Alice,\\n\\nYou are now signed up for Yoga, Monday, February 24, 2020 at 10:00, which you were on the waitlist for.\\n\\nWe are looking forward to see you.\\n\\nKind regards,\\nTest client",
        type: "customer_moved_from_waiting_list_to_class"
      }`,
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
      client: testClientId,
    }).fetch()

    await sails.helpers.sms.customer.classWaitingListSignupConvertedToClassSignup(waitingListSignup)

    expect(smsSendFake.firstCall.args[0]).to.matchPattern(`
      {
        user: {
          id: ${fixtures.userAlice.id},
          ...
        },
        message: 'Kære Alice\\n\\nDu er nu tilmeldt Yoga, mandag d. 24. februar 2020 kl. 10:00, som du stod på venteliste til.\\n\\nVi glæder os til at se dig!\\n\\nVenlig hilsen\\nTest client',
        type: "customer_moved_from_waiting_list_to_class"
      }`,
    )

    await ClassWaitingListSignup.destroy({id: waitingListSignup.id})
    await Class.destroy({id: classItem.id})
    await ClientSettings.destroy({id: clientSettingsRow.id})

  })

  it('should log if user has no phone number', async () => {

    const logFake = sinon.fake()
    logFake.info = logFake

    sinon.replace(sails.helpers, 'logger', () => logFake)

    const alicePhone = fixtures.userAlice.phone
    await User.update({id: fixtures.userAlice.id}, {phone: ''})

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

    await sails.helpers.sms.customer.classWaitingListSignupConvertedToClassSignup(waitingListSignup)

    expect(smsSendFake.callCount).to.equal(0)
    expect(logFake.getCalls()[1].args[0]).to.equal(`User ${fixtures.userAlice.id}, Alice Ali has no phone number. Skipping sms notification about getting seat on class ${classItem.id}`)


    await User.update({id: fixtures.userAlice.id}, {phone: alicePhone})
    await ClassWaitingListSignup.destroy({id: waitingListSignup.id})
    await Class.destroy({id: classItem.id})

  })

})
