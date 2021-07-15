const sinon = require('sinon');
const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID;
const fixtures = require('../../../fixtures/factory').fixtures;

const emailSendFakeFactory = require('../../../fakes/email-send-fake-factory');

describe('helpers.class-type-emails.check-and-send', async function () {

  let emailSendFake,
    yogaClass,
    hotYogaClass,
    archivedClass,
    cancelledClass,
    classTypeEmails;

  before(async () => {


    yogaClass = await Class.create({
      client: testClientId,
      date: '2020-06-01',
      start_time: '12:00:00',
      end_time: '14:00:00',
      class_type: fixtures.classTypeYoga.id,
    }).fetch();

    hotYogaClass = await Class.create({
      client: testClientId,
      date: '2020-06-01',
      start_time: '12:00:00',
      end_time: '14:00:00',
      class_type: fixtures.classTypeHotYoga.id,
    }).fetch();

    archivedClass = await Class.create({
      client: testClientId,
      date: '2020-06-01',
      start_time: '12:00:00',
      end_time: '14:00:00',
      class_type: fixtures.classTypeYoga.id,
      archived: true,
    }).fetch();

    cancelledClass = await Class.create({
      client: testClientId,
      date: '2020-06-01',
      start_time: '12:00:00',
      end_time: '14:00:00',
      class_type: fixtures.classTypeYoga.id,
      cancelled: true,
    }).fetch();

    classTypeEmails = await ClassTypeEmail.createEach([
      {
        client_id: testClientId,
        class_types: [fixtures.classTypeYoga.id],
        send_at: 'signup',
        send_to_signups: true,
        subject: 'Test subject 1',
        body: 'Test body 1',
      },
      {
        client_id: testClientId,
        class_types: [fixtures.classTypeYoga.id],
        send_at: 'cancel_booking',
        send_to_signups: true,
        subject: 'Test subject 2',
        body: 'Test body 2',
      },
      {
        client_id: testClientId,
        class_types: [fixtures.classTypeYoga.id],
        send_at: 'signup',
        send_to_livestream_signups: true,
        subject: 'Test subject 3',
        body: 'Test body 3',
      },
      {
        client_id: testClientId,
        class_types: [fixtures.classTypeYoga.id],
        send_at: 'cancel_booking',
        send_to_livestream_signups: true,
        subject: 'Test subject 4',
        body: 'Test body 4',
      },
      {
        client_id: testClientId,
        class_types: [fixtures.classTypeYoga.id],
        send_at: 'signup',
        send_to_waiting_list: true,
        subject: 'Test subject 5',
        body: 'Test body 5',
      },
      {
        client_id: testClientId,
        class_types: [fixtures.classTypeYoga.id],
        send_at: 'cancel_booking',
        send_to_waiting_list: true,
        subject: 'Test subject 6',
        body: 'Test body 6',
      },
    ]).fetch();

  });

  beforeEach(async () => {
    emailSendFake = emailSendFakeFactory.installEmailSendFake();
  });

  afterEach(async () => {
    sinon.restore();
  });

  after(async () => {
    await Class.destroy({id: [
        yogaClass.id,
        hotYogaClass.id,
        archivedClass.id,
        cancelledClass.id
      ]});
    await ClassTypeEmail.destroy({id: _.map(classTypeEmails, 'id')});
  })

  it('should do nothing if there are no relevant class type emails', async () => {

    const signup = await ClassSignup.create({
      client: testClientId,
      class: hotYogaClass.id,
      user: fixtures.userAlice.id,
    }).fetch();

    await sails.helpers.classTypeEmails.checkAndSendForClassSignup(signup);

    expect(emailSendFake.callCount).to.equal(0);

    await ClassSignup.destroy({id: signup.id});

  });

  it('should send email on class signup', async () => {

    const signup = await ClassSignup.create({
      client: testClientId,
      class: yogaClass.id,
      user: fixtures.userAlice.id,
    }).fetch();

    await sails.helpers.classTypeEmails.checkAndSendForClassSignup(signup);

    expect(emailSendFake.callCount).to.equal(1);

    expect(emailSendFake.getCall(0).args).to.matchPattern(`[{
      user: ${fixtures.userAlice.id},
      subject: 'Test subject 1',
      text: 'Test body 1',
      emailType: 'class_type_email',
      classId: ${yogaClass.id},
      classTypeEmailId: ${classTypeEmails[0].id} 
    }]`);

    await ClassSignup.destroy({id: signup.id});

  });

  it('should send email on cancel class booking', async () => {

    const signup = await ClassSignup.create({
      client: testClientId,
      class: yogaClass.id,
      user: fixtures.userAlice.id,
      archived: true,
    }).fetch();

    await sails.helpers.classTypeEmails.checkAndSendForClassCancelBooking(signup);

    expect(emailSendFake.callCount).to.equal(1);

    expect(emailSendFake.getCall(0).args).to.matchPattern(`[{
      user: ${fixtures.userAlice.id},
      subject: 'Test subject 2',
      text: 'Test body 2',
      emailType: 'class_type_email',
      classId: ${yogaClass.id},
      classTypeEmailId: ${classTypeEmails[1].id} 
    }]`);

    await ClassSignup.destroy({id: signup.id});

  });

  it('should send email on livestream signup', async () => {

    const signup = await ClassLivestreamSignup.create({
      client: testClientId,
      class: yogaClass.id,
      user: fixtures.userAlice.id,
    }).fetch();

    await sails.helpers.classTypeEmails.checkAndSendForLivestreamSignup(signup);

    expect(emailSendFake.callCount).to.equal(1);

    expect(emailSendFake.getCall(0).args).to.matchPattern(`[{
      user: ${fixtures.userAlice.id},
      subject: 'Test subject 3',
      text: 'Test body 3',
      emailType: 'class_type_email',
      classId: ${yogaClass.id},
      classTypeEmailId: ${classTypeEmails[2].id} 
    }]`);

    await ClassSignup.destroy({id: signup.id});

  });

  it('should send email on cancel livestream booking', async () => {

    const signup = await ClassLivestreamSignup.create({
      client: testClientId,
      class: yogaClass.id,
      user: fixtures.userAlice.id,
      archived: true,
    }).fetch();

    await sails.helpers.classTypeEmails.checkAndSendForLivestreamCancelBooking(signup);

    expect(emailSendFake.callCount).to.equal(1);

    expect(emailSendFake.getCall(0).args).to.matchPattern(`[{
      user: ${fixtures.userAlice.id},
      subject: 'Test subject 4',
      text: 'Test body 4',
      emailType: 'class_type_email',
      classId: ${yogaClass.id},
      classTypeEmailId: ${classTypeEmails[3].id} 
    }]`);

    await ClassSignup.destroy({id: signup.id});

  });

  it('should send email on class waiting list signup', async () => {

    const signup = await ClassWaitingListSignup.create({
      client: testClientId,
      class: yogaClass.id,
      user: fixtures.userAlice.id,
    }).fetch();

    await sails.helpers.classTypeEmails.checkAndSendForWaitingListSignup(signup);

    expect(emailSendFake.callCount).to.equal(1);

    expect(emailSendFake.getCall(0).args).to.matchPattern(`[{
      user: ${fixtures.userAlice.id},
      subject: 'Test subject 5',
      text: 'Test body 5',
      emailType: 'class_type_email',
      classId: ${yogaClass.id},
      classTypeEmailId: ${classTypeEmails[4].id} 
    }]`);

    await ClassSignup.destroy({id: signup.id});

  });

  it('should send email on remove from class waiting list', async () => {

    const signup = await ClassWaitingListSignup.create({
      client: testClientId,
      class: yogaClass.id,
      user: fixtures.userAlice.id,
      archived: true,
    }).fetch();

    await sails.helpers.classTypeEmails.checkAndSendForWaitingListCancelBooking(signup);

    expect(emailSendFake.callCount).to.equal(1);

    expect(emailSendFake.getCall(0).args).to.matchPattern(`[{
      user: ${fixtures.userAlice.id},
      subject: 'Test subject 6',
      text: 'Test body 6',
      emailType: 'class_type_email',
      classId: ${yogaClass.id},
      classTypeEmailId: ${classTypeEmails[5].id} 
    }]`);

    await ClassSignup.destroy({id: signup.id});

  });

});
