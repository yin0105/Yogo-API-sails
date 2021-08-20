const moment = require('moment-timezone');

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID;
const fixtures = require('../../../fixtures/factory').fixtures;

const MockDate = require('mockdate');
const sinon = require('sinon');
const supertest = require('supertest');

describe('controllers.Cron.cancel-class-waiting-lists', async () => {


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


  it('should cancel waiting lists that are due for cancellation (default deadlines)', async () => {

    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'no_show_fees_enabled',
      value: 1,
    }).fetch();

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

    const classPassAlice = await ClassPass.create({
      user: fixtures.userAlice.id,
      class_pass_type: fixtures.classPassTypeYogaTenClasses.id,
      classes_left: 5,
      client: testClientId,
    }).fetch();

    const waitingListSignups = await ClassWaitingListSignup.createEach([
      {
        'class': class1.id,
        user: fixtures.userAlice.id,
        used_class_pass: classPassAlice.id,
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

    MockDate.set(moment.tz('2020-02-24 08:00:00', 'Europe/Copenhagen'));

    await supertest(sails.hooks.http.app)
      .post(
        '/cron/cancel-class-waiting-lists' +
        '?client=' + testClientId)
      .expect(200);

    const calls = _.sortBy(
      _.map(emailSendFake.getCalls(), c => c.args[0]),
      c => c.user.id,
      );

    expect(calls).to.matchPattern(`
      [
        {          
          user: {id: ${fixtures.userAlice.id}, ... },
          subject: 'The waitlist is now cancelled for Yoga, Monday, February 24, 2020 at 10:00',
          text: 'Dear Alice,\\n\\nThe waitlist for Yoga, Monday, February 24, 2020 at 10:00 has now been cancelled, as the class will begin shortly. Unfortunately, there are still no spots available.\\n\\nIf you used a class pass with a set number of classes, the class has been returned to your class pass.\\n\\nKind regards,\\nTest client',
          blindCopyToClient: false,
          emailType: 'waiting_list_cancelled',
        },
        {         
          user: {id: ${fixtures.userBill.id}, ... },
          subject: 'The waitlist is now cancelled for Yoga, Monday, February 24, 2020 at 10:00',
          text: 'Dear Bill,\\n\\nThe waitlist for Yoga, Monday, February 24, 2020 at 10:00 has now been cancelled, as the class will begin shortly. Unfortunately, there are still no spots available.\\n\\nIf you used a class pass with a set number of classes, the class has been returned to your class pass.\\n\\nKind regards,\\nTest client',
          blindCopyToClient: false,
          emailType: 'waiting_list_cancelled',
        },
      ]`,
    );

    const updatedWaitingListSignups = await ClassWaitingListSignup.find({id: _.map(waitingListSignups, 'id')});

    expect(updatedWaitingListSignups).to.matchPattern(`[
      {
        user: ${fixtures.userAlice.id},
        used_class_pass: ${classPassAlice.id},
        archived: false,
        cancelled_at: _.isGreaterThan|0,
        ...
      },
      {
        user: ${fixtures.userBill.id},
        archived: false,
        cancelled_at: _.isGreaterThan|0,
        ...
      },
      {
        user: ${fixtures.userCharlie.id},
        archived: false,
        cancelled_at: 0,
        ...
      },
    ]`);

    const updatedClassPass = await ClassPass.findOne(classPassAlice.id);

    expect(updatedClassPass.classes_left).to.equal(6);

    MockDate.reset();
    await Class.destroy({id: [class1.id, class2.id]});
    await ClassWaitingListSignup.destroy({id: _.map(waitingListSignups, 'id')});
    await ClassPass.destroy({id: classPassAlice.id});
    await ClientSettings.destroy({id: clientSettingsRow.id});

  });

  it('should cancel waiting lists on classes longer time ahead if a client has a longer signoff deadline', async () => {

    const classes = await Class.createEach(
      [
        {
          class_type: fixtures.classTypeYoga.id,
          date: '2020-02-25',
          start_time: '10:00:00',
          end_time: '12:00:00',
          seats: 20,
          client: testClientId,
        },
        {
          class_type: fixtures.classTypeYoga.id,
          date: '2020-02-25',
          start_time: '11:00:00',
          end_time: '13:00:00',
          seats: 20,
          client: testClientId,
        },
        {
          class_type: fixtures.classTypeYoga.id,
          date: '2020-02-26',
          start_time: '10:00:00',
          end_time: '12:00:00',
          seats: 1,
          client: testClientId,
        },
        {
          class_type: fixtures.classTypeYoga.id,
          date: '2020-02-26',
          start_time: '11:00:00',
          end_time: '13:00:00',
          seats: 1,
          client: testClientId,
        },
      ],
    ).fetch();

    const waitingListSignups = await ClassWaitingListSignup.createEach([
      {
        'class': classes[0].id,
        user: fixtures.userAlice.id,
        client: testClientId,
      },
      {
        'class': classes[1].id,
        user: fixtures.userBill.id,
        client: testClientId,
      },
      {
        'class': classes[2].id,
        user: fixtures.userCharlie.id,
        client: testClientId,
      },
      {
        'class': classes[3].id,
        user: fixtures.userDennis.id,
        client: testClientId,
      },
    ]).fetch();

    const clientSettingsRows = await ClientSettings.createEach([
      {
        client: testClientId,
        key: 'no_show_fees_enabled',
        value: 1,
      },
      {
        client: testClientId,
        key: 'private_class_signoff_deadline',
        value: 4320, // 3 days
      }, {
        client: testClientId,
        key: 'class_signoff_deadline',
        value: 2880, // 2 days
      },
    ]).fetch();

    MockDate.set(moment.tz('2020-02-23 10:30:00', 'Europe/Copenhagen'));

    await supertest(sails.hooks.http.app)
      .post(
        '/cron/cancel-class-waiting-lists' +
        '?client=' + testClientId)
      .expect(200);

    const calls = _.map(emailSendFake.getCalls(), 'args');
    
    expect(calls).to.matchPattern(`
      [
        [{
          user: {id: ${fixtures.userAlice.id}, ... },
          subject: 'The waitlist is now cancelled for Yoga, Tuesday, February 25, 2020 at 10:00',
          ...
        }],
        [{
          user: {id: ${fixtures.userCharlie.id}, ... },
          subject: 'The waitlist is now cancelled for Yoga, Wednesday, February 26, 2020 at 10:00',
          ...
        }],
      ]`,
    );

    const updatedWaitingListSignups = await ClassWaitingListSignup.find({id: _.map(waitingListSignups, 'id')});

    expect(updatedWaitingListSignups).to.matchPattern(`[
      {
        user: ${fixtures.userAlice.id},
        archived: false,
        cancelled_at: _.isGreaterThan|0,
        ...
      },
      {
        user: ${fixtures.userBill.id},
        archived: false,
        cancelled_at:0,
        ...
      },
      {
        user: ${fixtures.userCharlie.id},
        archived: false,
        cancelled_at: _.isGreaterThan|0,
        ...
      },
      {
        user: ${fixtures.userDennis.id},
        archived: false,
        cancelled_at: 0,
        ...
      },
    ]`);

    MockDate.reset();
    await Class.destroy({id: _.map(classes, 'id')});
    await ClassWaitingListSignup.destroy({id: _.map(waitingListSignups, 'id')});
    await ClientSettings.destroy({id: _.map(clientSettingsRows, 'id')});

  });

  it('should log if there are no classes that need to cancel waiting lists', async () => {

    const logFake = sinon.fake();
    logFake.info = logFake;

    sinon.replace(sails.helpers, 'logger', () => logFake);

    await supertest(sails.hooks.http.app)
      .post(
        '/cron/cancel-class-waiting-lists' +
        '?client=' + testClientId)
      .expect(200);

    expect(logFake.getCalls()[1].args[0]).to.equal('No classes currently need to remove waiting lists');

    sinon.restore();

  });

});
