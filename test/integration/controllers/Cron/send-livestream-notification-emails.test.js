const moment = require('moment-timezone');

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID;
const fixtures = require('../../../fixtures/factory').fixtures;

const MockDate = require('mockdate');
const sinon = require('sinon');
const supertest = require('supertest');

describe('controllers.Cron.send-livestream-notification-emails', async () => {


  let emailSendFake;

  let originalFunction;

  beforeEach(async () => {
    emailSendFake = sinon.fake();
    originalFunction = sails.helpers.email.send;
    sails.helpers.email.send = {with: emailSendFake};
  });

  afterEach(() => {
    sails.helpers.email.send = originalFunction;
  });


  it('should send emails once to livestream signups for class where deadline has passed (default deadline)', async () => {

    const [class1, class2] = await Class.createEach(
      [
        {
          class_type: fixtures.classTypeYoga.id,
          date: '2020-02-24',
          start_time: '10:00:00',
          end_time: '12:00:00',
          seats: 20,
          client: testClientId,
        },
        {
          class_type: fixtures.classTypeYoga.id,
          date: '2020-02-24',
          start_time: '11:00:00',
          end_time: '13:00:00',
          seats: 20,
          client: testClientId,
        },
      ],
    ).fetch();

    const livestreamSignups = await ClassLivestreamSignup.createEach([
      {
        'class': class1.id,
        user: fixtures.userAlice.id,
        client: testClientId,
      },
      {
        'class': class1.id,
        user: fixtures.userBill.id,
        client: testClientId,
      },
      {
        'class': class2.id,
        user: fixtures.userCharlie.id,
        client: testClientId,
      },
    ]).fetch();

    MockDate.set(moment.tz('2020-02-24 09:30:00', 'Europe/Copenhagen'));

    await supertest(sails.hooks.http.app)
      .post(
        '/cron/send-livestream-notification-emails' +
        '?client=' + testClientId)
      .expect(200);

    expect(emailSendFake.callCount).to.equal(2);

    const calls = _.map(emailSendFake.getCalls(), call => call.args[0]);

    const livestreamLink = 'https://test-client.yogo.dk/frontend/index.html#/livestream/class/' + class1.id + '/preloader';

    expect(_.sortBy(calls, c => c.user.id)).to.matchPattern(`
      [
        {
          user: {id: ${fixtures.userAlice.id}, ... },
          subject: 'Livestream for Yoga at 10:00 will start shortly',
          text: 'Dear Alice,\\n\\nYou are signed up for the livestream for Yoga, Monday, February 24, 2020 at 10:00.\\n\\nThe class will start shortly and the livestream is available here:\\n${livestreamLink}\\n\\nKind regards,\\nTest client',
          blindCopyToClient: false,
          emailType: 'your_class_livestream_will_begin_shortly'
        },
        {
          user: {id: ${fixtures.userBill.id}, ... },
          subject: 'Livestream for Yoga at 10:00 will start shortly',
          text: 'Dear Bill,\\n\\nYou are signed up for the livestream for Yoga, Monday, February 24, 2020 at 10:00.\\n\\nThe class will start shortly and the livestream is available here:\\n${livestreamLink}\\n\\nKind regards,\\nTest client',
          blindCopyToClient: false,
          emailType: 'your_class_livestream_will_begin_shortly'
        },
      ]`
    );

    const updatedLivestreamSignups = await ClassLivestreamSignup.find({id: _.map(livestreamSignups, 'id')});

    expect(updatedLivestreamSignups).to.matchPattern(`[
      {
        user: ${fixtures.userAlice.id},
        notification_email_sent: true,
        ...
      },
      {
        user: ${fixtures.userBill.id},
        notification_email_sent: true,
        ...
      },
      {
        user: ${fixtures.userCharlie.id},
        notification_email_sent: false,
        ...
      },
    ]`);

    await supertest(sails.hooks.http.app)
      .post(
        '/cron/send-livestream-notification-emails' +
        '?client=' + testClientId)
      .expect(200);

    expect(emailSendFake.callCount).to.equal(2);

    MockDate.reset();
    await Class.destroy({id: [class1.id, class2.id]});
    await ClassLivestreamSignup.destroy({id: _.map(livestreamSignups, 'id')});

  });

  it('should send emails once to livestream signups for class where deadline has passed (custom deadline)', async () => {

    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'livestream_send_email_to_customers_minutes_before_class_start',
      value: 120,
    }).fetch();

    const [class1, class2, class3] = await Class.createEach(
      [
        {
          class_type: fixtures.classTypeYoga.id,
          date: '2020-02-24',
          start_time: '10:00:00',
          end_time: '12:00:00',
          seats: 20,
          client: testClientId,
        },
        {
          class_type: fixtures.classTypeYoga.id,
          date: '2020-02-24',
          start_time: '11:00:00',
          end_time: '13:00:00',
          seats: 20,
          client: testClientId,
        },
        {
          class_type: fixtures.classTypeYoga.id,
          date: '2020-02-25',
          start_time: '10:00:00',
          end_time: '12:00:00',
          seats: 20,
          client: testClientId,
        },
      ],
    ).fetch();

    const livestreamSignups = await ClassLivestreamSignup.createEach([
      {
        'class': class1.id,
        user: fixtures.userAlice.id,
        client: testClientId,
      },
      {
        'class': class1.id,
        user: fixtures.userBill.id,
        client: testClientId,
      },
      {
        'class': class2.id,
        user: fixtures.userCharlie.id,
        client: testClientId,
      },
      {
        'class': class3.id,
        user: fixtures.userDennis.id,
        client: testClientId,
      },
    ]).fetch();

    MockDate.set(moment.tz('2020-02-24 08:00:00', 'Europe/Copenhagen'));

    await supertest(sails.hooks.http.app)
      .post(
        '/cron/send-livestream-notification-emails' +
        '?client=' + testClientId)
      .expect(200);

    const calls = _.chain(emailSendFake.getCalls()).map('args').value();
    
    // const calls = _.map(emailSendFake.getCalls(), call => call.args[0]);

    const livestreamLink = 'https://test-client.yogo.dk/frontend/index.html#/livestream/class/' + class1.id + '/preloader';

    calls.sort((a, b) => {
      return a.id > b.id ? 1: -1;
    })

    // expect(calls).to.matchPattern(`
    expect(_.sortBy(calls, ([c]) => c.user.id)).to.matchPattern(`
      [
        [{
          user: {id: ${fixtures.userAlice.id}, ... },
          subject: 'Livestream for Yoga at 10:00 will start shortly',
          text: 'Dear Alice,\\n\\nYou are signed up for the livestream for Yoga, Monday, February 24, 2020 at 10:00.\\n\\nThe class will start shortly and the livestream is available here:\\n${livestreamLink}\\n\\nKind regards,\\nTest client',
          blindCopyToClient: false,
          emailType: 'your_class_livestream_will_begin_shortly'
        }],
        [{
          user: {id: ${fixtures.userBill.id}, ... },
          subject: 'Livestream for Yoga at 10:00 will start shortly',
          text: 'Dear Bill,\\n\\nYou are signed up for the livestream for Yoga, Monday, February 24, 2020 at 10:00.\\n\\nThe class will start shortly and the livestream is available here:\\n${livestreamLink}\\n\\nKind regards,\\nTest client',
          blindCopyToClient: false,
          emailType: 'your_class_livestream_will_begin_shortly'
        }],
      ]`
    );

    const updatedLivestreamSignups = await ClassLivestreamSignup.find({id: _.map(livestreamSignups, 'id')});

    expect(updatedLivestreamSignups).to.matchPattern(`[
      {
        user: ${fixtures.userAlice.id},
        notification_email_sent: true,
        ...
      },
      {
        user: ${fixtures.userBill.id},
        notification_email_sent: true,
        ...
      },
      {
        user: ${fixtures.userCharlie.id},
        notification_email_sent: false,
        ...
      },
      {
        user: ${fixtures.userDennis.id},
        notification_email_sent: false,
        ...
      },
    ]`);

    await supertest(sails.hooks.http.app)
      .post(
        '/cron/send-livestream-notification-emails' +
        '?client=' + testClientId)
      .expect(200);

    expect(emailSendFake.callCount).to.equal(2);

    MockDate.reset();
    await Class.destroy({id: [class1.id, class2.id]});
    await ClassLivestreamSignup.destroy({id: _.map(livestreamSignups, 'id')});
    await ClientSettings.destroy({id: clientSettingsRow.id});

  });

  it('should log if there are no classes that need to cancel waiting lists', async () => {

    const logFake = sinon.fake();
    logFake.info = logFake;

    sinon.replace(sails.helpers, 'logger', () => logFake);

    await supertest(sails.hooks.http.app)
      .post(
        '/cron/send-livestream-notification-emails' +
        '?client=' + testClientId)
      .expect(200);

    expect(logFake.getCalls()[1].args[0]).to.equal('Sending no livestream notification emails');

    sinon.restore();

  });

});
