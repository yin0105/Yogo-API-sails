const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID;
const fixtures = require('../../../fixtures/factory').fixtures;
const sinon = require('sinon');

describe('helpers.classes.check-if-waiting-list-should-be-applied', async () => {

  let
    emailSendFake,
    smsSendFake;


  beforeEach(async () => {
    emailSendFake = sinon.fake();
    emailSendFake.with = emailSendFake;
    sinon.replace(sails.helpers.email, 'send', emailSendFake);

    smsSendFake = sinon.fake();
    smsSendFake.with = smsSendFake;
    sinon.replace(sails.helpers.sms, 'send', smsSendFake);
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should move people from waiting list to class signups', async () => {

    const classItem = await Class.create({
      date: '2020-02-24',
      start_time: '10:00:00',
      end_time: '12:00:00',
      client: testClientId,
      class_type: fixtures.classTypeYoga.id,
      seats: 2,
    }).fetch();

    const waitingListSignups = await ClassWaitingListSignup.createEach([
      {
        'class': classItem.id,
        user: fixtures.userAlice.id,
        client: testClientId,
        createdAt: 1000,
      },
      {
        'class': classItem.id,
        user: fixtures.userBill.id,
        client: testClientId,
        createdAt: 3000,
      },
      {
        'class': classItem.id,
        user: fixtures.userCharlie.id,
        client: testClientId,
        createdAt: 2000,
      },
    ]).fetch();

    const timestampBeforeCall = Date.now();

    await sails.helpers.classes.checkIfWaitingListShouldBeApplied(classItem);

    const timestampAfterCall = Date.now();

    const createdClassSignups = await ClassSignup.find({'class': classItem.id});

    expect(createdClassSignups).to.matchPattern(`
      [
        {
          user: ${fixtures.userAlice.id},
          ...
        },
        {
          user: ${fixtures.userCharlie.id},
          ...
        }
      ]`,
    );

    const updatedWaitingListSignups = await ClassWaitingListSignup.find({id: _.map(waitingListSignups, 'id')});

    expect(updatedWaitingListSignups).to.matchPattern(`
      [
        {
          user: ${fixtures.userAlice.id},
          archived: false,
          cancelled_at: _.isBetween|${timestampBeforeCall}|${timestampAfterCall},
          ...
        },
        {
          user: ${fixtures.userBill.id},
          archived: false,
          ...
        },
        {
          user: ${fixtures.userCharlie.id},
          archived: false,
          cancelled_at: _.isBetween|${timestampBeforeCall}|${timestampAfterCall},
          ...
        },
      ]`,
    );

    expect(emailSendFake.callCount).to.equal(2);
    expect(smsSendFake.callCount).to.equal(2);

    await ClassWaitingListSignup.destroy({class: classItem.id});
    await ClassSignup.destroy({class: classItem.id});
    await Class.destroy({id: classItem.id});

  });

  it('should move one person from waiting list to class signups', async () => {

    const classItem = await Class.create({
      date: '2020-02-24',
      start_time: '10:00:00',
      end_time: '12:00:00',
      client: testClientId,
      class_type: fixtures.classTypeYoga.id,
      seats: 2,
    }).fetch();

    await ClassSignup.create({
      'class': classItem.id,
      user: fixtures.userAlice.id,
      client: testClientId,
    });

    const waitingListSignups = await ClassWaitingListSignup.createEach([
      {
        'class': classItem.id,
        user: fixtures.userBill.id,
        client: testClientId,
        createdAt: 3000,
      },
      {
        'class': classItem.id,
        user: fixtures.userCharlie.id,
        client: testClientId,
        createdAt: 2000,
      },
    ]).fetch();

    const timestampBeforeCall = Date.now();

    await sails.helpers.classes.checkIfWaitingListShouldBeApplied(classItem);

    const timestampAfterCall = Date.now();

    const classSignups = await ClassSignup.find({'class': classItem.id});

    expect(classSignups).to.matchPattern(`
      [
        {
          user: ${fixtures.userAlice.id},
          ...
        },
        {
          user: ${fixtures.userCharlie.id},
          ...
        }
      ]`,
    );

    const updatedWaitingListSignups = await ClassWaitingListSignup.find({id: _.map(waitingListSignups, 'id')});

    expect(updatedWaitingListSignups).to.matchPattern(`
      [
        {
          user: ${fixtures.userBill.id},
          archived: false,
          ...
        },
        {
          user: ${fixtures.userCharlie.id},
          archived: false,
          cancelled_at: _.isBetween|${timestampBeforeCall}|${timestampAfterCall},
          ...
        },
      ]`,
    );

    expect(emailSendFake.callCount).to.equal(1);
    expect(smsSendFake.callCount).to.equal(1);

    await ClassWaitingListSignup.destroy({class: classItem.id});
    await ClassSignup.destroy({class: classItem.id});
    await Class.destroy({id: classItem.id});

  });

  it('should move all people from waiting list to class signups', async () => {

    const classItem = await Class.create({
      date: '2020-02-24',
      start_time: '10:00:00',
      end_time: '12:00:00',
      client: testClientId,
      class_type: fixtures.classTypeYoga.id,
      seats: 5,
    }).fetch();

    await ClassSignup.create({
      'class': classItem.id,
      user: fixtures.userAlice.id,
      client: testClientId,
    });

    const waitingListSignups = await ClassWaitingListSignup.createEach([

      {
        'class': classItem.id,
        user: fixtures.userBill.id,
        client: testClientId,
        createdAt: 3000,
      },
      {
        'class': classItem.id,
        user: fixtures.userCharlie.id,
        client: testClientId,
        createdAt: 2000,
      },
      {
        'class': classItem.id,
        user: fixtures.userDennis.id,
        client: testClientId,
        createdAt: 1000,
      },
    ]).fetch();

    const timestampBeforeCall = Date.now();

    await sails.helpers.classes.checkIfWaitingListShouldBeApplied(classItem);

    const timestampAfterCall = Date.now();

    const classSignups = await ClassSignup.find({'class': classItem.id});

    expect(classSignups).to.matchPattern(`
      [
        {
          user: ${fixtures.userAlice.id},
          ...
        },
        {
          user: ${fixtures.userDennis.id},
          ...
        },
        {
          user: ${fixtures.userCharlie.id},
          ...
        },
        {
          user: ${fixtures.userBill.id},
          ...
        }
      ]`,
    );

    const updatedWaitingListSignups = await ClassWaitingListSignup.find({id: _.map(waitingListSignups, 'id')});

    expect(updatedWaitingListSignups).to.matchPattern(`
      [
        {
          user: ${fixtures.userBill.id},
          archived: false,
          cancelled_at: _.isBetween|${timestampBeforeCall}|${timestampAfterCall},
          ...
        },
        {
          user: ${fixtures.userCharlie.id},
          archived: false,
          cancelled_at: _.isBetween|${timestampBeforeCall}|${timestampAfterCall},
          ...
        },
        {
          user: ${fixtures.userDennis.id},
          archived: false,
          cancelled_at: _.isBetween|${timestampBeforeCall}|${timestampAfterCall},
          ...
        },
      ]`,
    );

    expect(emailSendFake.callCount).to.equal(3);
    expect(smsSendFake.callCount).to.equal(3);

    await ClassWaitingListSignup.destroy({class: classItem.id});
    await ClassSignup.destroy({class: classItem.id});
    await Class.destroy({id: classItem.id});

  });


});
