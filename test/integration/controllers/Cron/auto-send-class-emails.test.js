const moment = require('moment-timezone');

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID;
const fixtures = require('../../../fixtures/factory').fixtures;

const MockDate = require('mockdate');
const sinon = require('sinon');
const supertest = require('supertest');

describe('controllers.Cron.auto-send-class-emails', async () => {

  let
    emailSendFake,
    originalFunction,
    classObj,
    signups,
    waitingListSignups,
    email;

  beforeEach(async () => {
    emailSendFake = sinon.fake();
    originalFunction = sails.helpers.email.send;
    sails.helpers.email.send = {with: emailSendFake};

    classObj = await Class.create({
      client: testClientId,
      date: '2020-05-15',
      start_time: '20:00:00',
      end_time: '21:00:00',
      class_type: fixtures.classTypeYoga.id,
    }).fetch();

    signups = await ClassSignup.createEach([
      {
        'class': classObj.id,
        user: fixtures.userAlice.id,
        client: testClientId,
      },
    ]).fetch();

    waitingListSignups = await ClassWaitingListSignup.createEach([
      {
        'class': classObj.id,
        user: fixtures.userBill.id,
        client: testClientId,
      },
    ]).fetch();

    email = await ClassEmail.create({
      client_id: testClientId,
      class_id: classObj.id,
      sender_id: fixtures.userAdmin.id,
      subject: 'Test subject [first_name] [last_name], [email]',
      body: 'Test body [first_name] [last_name], [email]',
      send_to_signups: true,
      send_to_waiting_list: true,
      send_to_subsequent_signups: true,
      send_at_datetime: '2020-05-15 16:00:00',
      email_sent: false,
      auto_send_status: 'active',
    }).fetch();

  });

  afterEach(async () => {
    sails.helpers.email.send = originalFunction;

    await Class.destroy({id: classObj.id});
    await ClassSignup.destroy({id: _.map(signups, 'id')});
    await ClassWaitingListSignup.destroy({id: _.map(waitingListSignups, 'id')});
    await ClassEmail.destroy({});
    await ClassEmailInstance.destroy({});
  });

  after(async () => {
    MockDate.reset();
  });

  it('should do nothing if email is scheduled for later sending', async () => {

    MockDate.set(moment.tz('2020-05-15 15:59:59', 'Europe/Copenhagen'));

    await supertest(sails.hooks.http.app)
      .post('/cron/auto-send-class-emails')
      .expect(200);

    const updatedEmail = await ClassEmail.findOne({id: email.id});
    expect(updatedEmail).to.matchPattern(
      `{
        email_sent: false,
        auto_send_status: 'active',
        ...
      }`,
    );

    const emailInstances = await ClassEmailInstance.find({class_email_id: email.id});
    expect(emailInstances.length).to.equal(0);

    expect(emailSendFake.callCount).to.equal(0);

  });


  it('should send emails that have been scheduled for later sending and time has passed', async () => {

    await ClassEmail.update({id: email.id}, {
      email_sent: false,
      auto_send_status: 'active',
    });

    MockDate.set(moment.tz('2020-05-15 16:00:00', 'Europe/Copenhagen'));

    await supertest(sails.hooks.http.app)
      .post('/cron/auto-send-class-emails')
      .expect(200);

    const allInstances = await ClassEmailInstance.find({}).sort('recipient_id ASC');

    expect(emailSendFake.callCount).to.equal(2);
    expect(emailSendFake.getCall(1).args[0]).to.matchPattern(
      `{
        user: {id: ${fixtures.userBill.id}, ...},
        subject: 'Test subject Bill Billion, userBill@yogo.dk',
        text: 'Test body Bill Billion, userBill@yogo.dk',        
        ...
      }`,
    );

    allInstances.sort((a, b) => {
      return a.recipient_id > b.recipient_id ? 1 : -1;
    });

    expect(allInstances).to.matchPattern(
      `[{
        class_email_id: ${email.id},
        recipient_id: ${fixtures.userAlice.id},
        ...
        },
        {
        class_email_id: ${email.id},
        recipient_id: ${fixtures.userBill.id},
        ...
      }]`,
    );

    const updatedClassEmail = await ClassEmail.findOne({id: email.id});
    expect(updatedClassEmail).matchPattern(
      `{
        email_sent: true,
        ...
      }`,
    );

    

  });


  it('should do nothing if email is sent and there are no new signups', async () => {
    await ClassEmail.update({id: email.id}, {
      email_sent: true,
      auto_send_status: 'active',
    });

    await ClassEmailInstance.createEach([
      {
        client_id: testClientId,
        class_email_id: email.id,
        recipient_id: fixtures.userAlice.id,
      },
      {
        client_id: testClientId,
        class_email_id: email.id,
        recipient_id: fixtures.userBill.id,
      }
    ]).fetch();


    MockDate.set(moment.tz('2020-05-15 16:00:00', 'Europe/Copenhagen'));

    await supertest(sails.hooks.http.app)
      .post('/cron/auto-send-class-emails')
      .expect(200);

    const updatedEmail = await ClassEmail.findOne({id: email.id});
    expect(updatedEmail).to.matchPattern(
      `{
        email_sent: true,
        auto_send_status: 'active',
        ...
      }`,
    );

    const allInstances = await ClassEmailInstance.find({})
    expect(allInstances.length).to.equal(2)

    expect(emailSendFake.callCount).to.equal(0);

  });


  it('should send emails to new signups/waiting list signups', async () => {

    await ClassEmail.update({id: email.id}, {
      email_sent: true,
    });

    MockDate.set(moment.tz('2020-05-15 16:00:00', 'Europe/Copenhagen'));

    await ClassEmailInstance.createEach([
      {
        client_id: testClientId,
        class_email_id: email.id,
        recipient_id: fixtures.userAlice.id,
      },
    ]).fetch();

    await supertest(sails.hooks.http.app)
      .post('/cron/auto-send-class-emails')
      .expect(200);

    const allInstances = await ClassEmailInstance.find({});

    allInstances.sort((a, b) => {
      return a.recipient_id > b.recipient_id ? 1 : -1;
    });
    
    expect(allInstances).to.matchPattern(
      `[{
        class_email_id: ${email.id},
        recipient_id: ${fixtures.userAlice.id},
        ...
        },
        {
        class_email_id: ${email.id},
        recipient_id: ${fixtures.userBill.id},
        ...
      }]`,
    );

    expect(emailSendFake.callCount).to.equal(1);
    expect(emailSendFake.firstCall.args[0]).to.matchPattern(
      `{
        user: {id: ${fixtures.userBill.id}, ... },
        subject: 'Test subject Bill Billion, userBill@yogo.dk',
        text: 'Test body Bill Billion, userBill@yogo.dk',        
        ...
      }`,
    );

  });

  it('should stop checking for new signups when class starts', async () => {

    await ClassEmail.update({id: email.id}, {
      email_sent: true,
    });

    await ClassEmailInstance.createEach([
      {
        client_id: testClientId,
        class_email_id: email.id,
        recipient_id: fixtures.userAlice.id,
      },
      {
        client_id: testClientId,
        class_email_id: email.id,
        recipient_id: fixtures.userBill.id,
      }
    ]).fetch();

    MockDate.set(moment.tz('2020-05-15 19:59:59', 'Europe/Copenhagen'));

    await supertest(sails.hooks.http.app)
      .post('/cron/auto-send-class-emails')
      .expect(200);

    const updatedEmail = await ClassEmail.findOne({id: email.id});
    expect(updatedEmail).to.matchPattern(
      `{
        email_sent: true,
        auto_send_status: 'active',
        ...
      }`,
    );

    const allInstances = await ClassEmailInstance.find({})
    expect(allInstances.length).to.equal(2)

    expect(emailSendFake.callCount).to.equal(0);

    // Now try with time has passed class start

    MockDate.set(moment.tz('2020-05-15 20:00:00', 'Europe/Copenhagen'));

    await supertest(sails.hooks.http.app)
      .post('/cron/auto-send-class-emails')
      .expect(200);

    const updatedEmail2 = await ClassEmail.findOne({id: email.id});
    expect(updatedEmail2).to.matchPattern(
      `{
        email_sent: true,
        auto_send_status: 'done',
        ...
      }`,
    );

    const allInstances2 = await ClassEmailInstance.find({})
    expect(allInstances2.length).to.equal(2)

    expect(emailSendFake.callCount).to.equal(0);

  })



});
