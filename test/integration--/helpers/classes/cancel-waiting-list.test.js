const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID;
const fixtures = require('../../../fixtures/factory').fixtures;
const sinon = require('sinon');
const emailSendFakeFactory = require('../../../fakes/email-send-fake-factory');

describe('helpers.classes.cancel-waiting-list', async () => {

  let emailSendFake;

  beforeEach(async () => {
    emailSendFake = emailSendFakeFactory.installEmailSendFake();
    await ClassWaitingListSignup.destroy({})
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should cancel waiting list and send emails in English', async () => {

    const classItem = await Class.create({
      date: '2020-02-24',
      start_time: '10:00:00',
      end_time: '12:00:00',
      client: testClientId,
      class_type: fixtures.classTypeYoga.id,
    }).fetch();

    const waitingListSignups = await ClassWaitingListSignup.createEach([
      {
        'class': classItem.id,
        user: fixtures.userAlice.id,
        client: testClientId,
      },
      {
        'class': classItem.id,
        user: fixtures.userBill.id,
        client: testClientId,
      },
    ]).fetch();

    await sails.helpers.classes.cancelWaitingList(classItem);

    expect(emailSendFake.callCount).to.equal(2);
    const sortedEmailArgs = _.sortBy(
      [emailSendFake.firstCall.args[0], emailSendFake.getCall(1).args[0]],
      args => args.user.id,
    );
    expect(sortedEmailArgs).to.matchPattern(`[
      {
        user: {id: ${fixtures.userAlice.id}, ... },
        subject: 'The waitlist is now cancelled for Yoga, Monday, February 24, 2020 at 10:00',
        text: 'Dear Alice,\\n\\nThe waitlist for Yoga, Monday, February 24, 2020 at 10:00 has now been cancelled, as the class will begin shortly. Unfortunately, there are still no spots available.\\n\\nIf you used a class pass with a set number of classes, the class has been returned to your class pass.\\n\\nKind regards,\\nTest client',
        blindCopyToClient: false,
        emailType: 'waiting_list_cancelled'
      },
      {
        user: {id: ${fixtures.userBill.id}, ... },
        subject: 'The waitlist is now cancelled for Yoga, Monday, February 24, 2020 at 10:00',
        text: 'Dear Bill,\\n\\nThe waitlist for Yoga, Monday, February 24, 2020 at 10:00 has now been cancelled, as the class will begin shortly. Unfortunately, there are still no spots available.\\n\\nIf you used a class pass with a set number of classes, the class has been returned to your class pass.\\n\\nKind regards,\\nTest client',
        blindCopyToClient: false,
        emailType: 'waiting_list_cancelled'
      }]`,
    );

    const updatedWaitingListSignups = await ClassWaitingListSignup.find({id: _.map(waitingListSignups, 'id')});

    expect(updatedWaitingListSignups).to.matchPattern(`
      [
        {
          archived: false,
          cancelled_at: _.isGreaterThan|0,
          ...
        },
        {
          archived: false,
          cancelled_at: _.isGreaterThan|0,
          ...
        }
      ]`,
    );

    await ClassWaitingListSignup.destroy({id: _.map(waitingListSignups, 'id')});
    await Class.destroy({id: classItem.id});

  });

  it('should send emails in Danish', async () => {

    const classItem = await Class.create({
      date: '2020-02-24',
      start_time: '10:00:00',
      end_time: '12:00:00',
      client: testClientId,
      class_type: fixtures.classTypeYoga.id,
    }).fetch();

    const waitingListSignups = await ClassWaitingListSignup.createEach([
      {
        'class': classItem.id,
        user: fixtures.userAlice.id,
        client: testClientId,
      },
      {
        'class': classItem.id,
        user: fixtures.userBill.id,
        client: testClientId,
      },
    ]).fetch();

    const clientSettingsRow = await ClientSettings.create({
      key: 'locale',
      value: 'da',
      client: testClientId,
    }).fetch();

    await sails.helpers.classes.cancelWaitingList(classItem);

    const sortedSendEmailArgs = _.sortBy(
      [emailSendFake.firstCall.args[0], emailSendFake.getCall(1).args[0]],
      args => args.user.id,
    );
    expect(sortedSendEmailArgs).to.matchPattern(`[
      {
        user: {id: ${fixtures.userAlice.id}, ... },
        subject: 'Ventelisten er nu annulleret til Yoga, mandag d. 24. februar 2020 kl. 10:00',
        text: 'Kære Alice\\n\\nVentelisten til Yoga, mandag d. 24. februar 2020 kl. 10:00 er nu annulleret, da holdet starter inden længe. Du fik desværre ikke plads på holdet.\\n\\nHvis du brugte et klippekort til at tilmelde dig ventelisten, har du fået dit klip tilbage.\\n\\nVenlig hilsen\\nTest client',
        blindCopyToClient: false,
        emailType: 'waiting_list_cancelled'
      },
      {
        user: {id: ${fixtures.userBill.id}, ... },
        subject: 'Ventelisten er nu annulleret til Yoga, mandag d. 24. februar 2020 kl. 10:00',
        text: 'Kære Bill\\n\\nVentelisten til Yoga, mandag d. 24. februar 2020 kl. 10:00 er nu annulleret, da holdet starter inden længe. Du fik desværre ikke plads på holdet.\\n\\nHvis du brugte et klippekort til at tilmelde dig ventelisten, har du fået dit klip tilbage.\\n\\nVenlig hilsen\\nTest client',
        blindCopyToClient: false,
        emailType: 'waiting_list_cancelled'
      }     
    ]`,
    );

    const updatedWaitingListSignups = await ClassWaitingListSignup.find({id: _.map(waitingListSignups, 'id')});
    expect(updatedWaitingListSignups).to.matchPattern(`
      [
        {
          archived: false,
          cancelled_at: _.isGreaterThan|0,
          ...
        },
        {
          archived: false,
          cancelled_at: _.isGreaterThan|0,
          ...
        }
      ]`,
    );

    await ClassWaitingListSignup.destroy({id: _.map(waitingListSignups, 'id')});
    await Class.destroy({id: classItem.id});
    await ClientSettings.destroy({id: clientSettingsRow.id});

  });

  it('should send bcc to client', async () => {

    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'email_bcc_to_client_on_class_waiting_list_cancelled',
      value: 1
    }).fetch();

    const classItem = await Class.create({
      date: '2020-02-24',
      start_time: '10:00:00',
      end_time: '12:00:00',
      client: testClientId,
      class_type: fixtures.classTypeYoga.id,
    }).fetch();

    const waitingListSignups = await ClassWaitingListSignup.createEach([
      {
        'class': classItem.id,
        user: fixtures.userAlice.id,
        client: testClientId,
      },
      {
        'class': classItem.id,
        user: fixtures.userBill.id,
        client: testClientId,
      },
    ]).fetch();

    await sails.helpers.classes.cancelWaitingList(classItem);

    expect(emailSendFake.callCount).to.equal(2);
    const sortedEmailArgs = _.sortBy(
      [emailSendFake.firstCall.args[0], emailSendFake.getCall(1).args[0]],
      args => args.user.id,
    );
    expect(sortedEmailArgs).to.matchPattern(`[
      {
        user: {id: ${fixtures.userAlice.id}, ... },
        subject: 'The waitlist is now cancelled for Yoga, Monday, February 24, 2020 at 10:00',
        text: 'Dear Alice,\\n\\nThe waitlist for Yoga, Monday, February 24, 2020 at 10:00 has now been cancelled, as the class will begin shortly. Unfortunately, there are still no spots available.\\n\\nIf you used a class pass with a set number of classes, the class has been returned to your class pass.\\n\\nKind regards,\\nTest client',
        blindCopyToClient: true,
        emailType: 'waiting_list_cancelled'
      },
      {
        user: {id: ${fixtures.userBill.id}, ... },
        subject: 'The waitlist is now cancelled for Yoga, Monday, February 24, 2020 at 10:00',
        text: 'Dear Bill,\\n\\nThe waitlist for Yoga, Monday, February 24, 2020 at 10:00 has now been cancelled, as the class will begin shortly. Unfortunately, there are still no spots available.\\n\\nIf you used a class pass with a set number of classes, the class has been returned to your class pass.\\n\\nKind regards,\\nTest client',
        blindCopyToClient: true,
        emailType: 'waiting_list_cancelled'
      }]`,
    );

    const updatedWaitingListSignups = await ClassWaitingListSignup.find({id: _.map(waitingListSignups, 'id')});

    expect(updatedWaitingListSignups).to.matchPattern(`
      [
        {
          archived: false,
          cancelled_at: _.isGreaterThan|0,
          ...
        },
        {
          archived: false,
          cancelled_at: _.isGreaterThan|0,
          ...
        }
      ]`,
    );

    await ClassWaitingListSignup.destroy({id: _.map(waitingListSignups, 'id')});
    await Class.destroy({id: classItem.id});
    await ClientSettings.destroy({id: clientSettingsRow.id});

  });

});
