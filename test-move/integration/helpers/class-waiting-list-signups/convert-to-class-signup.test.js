const assert = require('assert');
const sinon = require('sinon');
const assertAsyncThrows = require('../../../utils/assert-async-throws');

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID;
const fixtures = require('../../../fixtures/factory').fixtures;

const MockDate = require('mockdate');
const moment = require('moment-timezone');


describe('helpers.class-waiting-list-signups.convert-to-class-signup', async function () {

  let class1;

  before(async () => {

    class1 = await Class.create({
      date: '2018-05-15',
      start_time: '12:00:00',
      end_time: '14:00:00',
      client: testClientId,
      class_type: fixtures.classTypeYoga.id,
    }).fetch();

  });

  afterEach(async () => {
    sinon.restore();
  });

  after(async () => {

    await Class.destroy({
      id: class1.id,
    });

  });


  it('should throw "waitingListSignupNotFound" if signup does not exist', async () => {

    // Test with signup id
    await assertAsyncThrows(
      async () => {
        await sails.helpers.classWaitingListSignups.convertToClassSignup.with({
          waitingListSignup: 9999999,
        });
      },
      'waitingListSignupNotFound',
    );

    // Test with signup object
    await assertAsyncThrows(
      async () => {
        await sails.helpers.classWaitingListSignups.convertToClassSignup.with({
          waitingListSignup: {
            id: 9999999,
          },
        });
      },
      'waitingListSignupNotFound',
    );

  });

  it('should return "Waiting list signup already cancelled." if signup is cancelled.', async () => {

    const waitingListSignup = await ClassWaitingListSignup.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      'class': class1.id,
      cancelled_at: Date.now(),
    }).fetch();

    const result = await sails.helpers.classWaitingListSignups.convertToClassSignup.with({
      waitingListSignup: waitingListSignup,
    });

    assert.equal(
      result,
      'Waiting list signup already cancelled.',
    );

    await ClassWaitingListSignup.destroy({id: waitingListSignup.id});

  });


  it('should convert waiting list signup to class signup with same used_class_pass', async () => {

    const emailSendFake = sinon.fake();
    emailSendFake.with = emailSendFake;
    sinon.replace(sails.helpers.email, 'send', emailSendFake);

    const smsSendFake = sinon.fake();
    smsSendFake.with = smsSendFake;
    sinon.replace(sails.helpers.sms, 'send', smsSendFake);

    const classPass = await ClassPass.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      class_pass_type: fixtures.classPassTypeYogaTenClasses.id,
      classes_left: 5,
    }).fetch();

    const waitingListSignup = await ClassWaitingListSignup.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      'class': class1.id,
      used_class_pass: classPass.id,
      class_pass_seat_spent: true,
    }).fetch();

    // Deadline is 2 hours = 2018-05-15 10:00:00
    MockDate.set(moment.tz('2018-05-15 09:59:58', 'Europe/Copenhagen'));

    const createdClassSignup = await sails.helpers.classWaitingListSignups.convertToClassSignup.with({
      waitingListSignup: waitingListSignup,
    });

    const updatedWaitingListSignup = await ClassWaitingListSignup.findOne(waitingListSignup.id);

    expect(updatedWaitingListSignup).to.matchPattern(`{
      archived: false,
      cancelled_at: _.isGreaterThan|0,
      class_pass_seat_spent: false,
      ...
    }`);

    const notUpdatedClassPass = await ClassPass.findOne(classPass.id);

    assert.equal(
      notUpdatedClassPass.classes_left,
      5,
    );

    expect(createdClassSignup).to.matchPattern(`{
      client_id: ${testClientId},
      class_id: ${class1.id},
      user_id: ${fixtures.userAlice.id},
      used_class_pass_id: ${classPass.id},
      used_membership_id: null,
      class_pass_seat_spent: 1,
      ...
    }`);

    expect(smsSendFake.callCount).to.equal(1);
    expect(emailSendFake.callCount).to.equal(1);

    await ClassPass.destroy({id: classPass.id});
    await ClassWaitingListSignup.destroy({id: waitingListSignup.id});
    await ClassSignup.destroy({id: createdClassSignup.id});

    sinon.restore();

  });

  it('should convert waiting list signup to class signup with same used_membership', async () => {

    const emailSendFake = sinon.fake();
    emailSendFake.with = emailSendFake;
    sinon.replace(sails.helpers.email, 'send', emailSendFake);

    const smsSendFake = sinon.fake();
    smsSendFake.with = smsSendFake;
    sinon.replace(sails.helpers.sms, 'send', smsSendFake);

    const membership = await Membership.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
    }).fetch();

    const waitingListSignup = await ClassWaitingListSignup.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      'class': class1.id,
      used_membership: membership.id,
    }).fetch();

    // Deadline is 2 hours = 2018-05-15 10:00:00
    MockDate.set(moment.tz('2018-05-15 09:59:58', 'Europe/Copenhagen'));

    const timestampBeforeCall = Date.now();

    const createdClassSignup = await sails.helpers.classWaitingListSignups.convertToClassSignup.with({
      waitingListSignup: waitingListSignup,
    });

    const timestampAfterCall = Date.now();

    const updatedWaitingListSignup = await ClassWaitingListSignup.findOne(waitingListSignup.id);

    expect(updatedWaitingListSignup).to.matchPattern(`{
      archived: false,
      cancelled_at: _.isBetween|${timestampBeforeCall-1}|${timestampAfterCall+1},
      ...
    }`);

    expect(createdClassSignup).to.matchPattern(`{
      client_id: ${testClientId},
      class_id: ${class1.id},
      user_id: ${fixtures.userAlice.id},
      used_membership_id: ${membership.id},
      used_class_pass_id: null,
      class_pass_seat_spent: 0,
      ...
    }`);

    expect(smsSendFake.callCount).to.equal(1);
    expect(emailSendFake.callCount).to.equal(1);

    await ClassPass.destroy({id: membership.id});
    await ClassWaitingListSignup.destroy({id: waitingListSignup.id});
    await ClassSignup.destroy({id: createdClassSignup.id});

    sinon.restore();

  });

});
