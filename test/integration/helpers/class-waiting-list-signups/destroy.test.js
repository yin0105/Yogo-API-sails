const assert = require('assert');

const assertAsyncThrows = require('../../../utils/assert-async-throws');

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID;
const fixtures = require('../../../fixtures/factory').fixtures;

const MockDate = require('mockdate');
const moment = require('moment-timezone');

describe('helpers.classWaitingListSignups.destroy', async function () {

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

  after(async () => {

    await Class.destroy({
      id: class1.id,
    });

  });


  it('should throw "waitingListSignupNotFound" if signup does not exist', async () => {

    // Test with signup id
    await assertAsyncThrows(
      async () => {
        await sails.helpers.classWaitingListSignups.destroy.with({
          waitingListSignup: 9999999,
        });
      },
      'waitingListSignupNotFound',
    );

    // Test with signup object
    await assertAsyncThrows(
      async () => {
        await sails.helpers.classWaitingListSignups.destroy.with({
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
      archived: false,
      cancelled_at: Date.now(),
    }).fetch();

    const result = await sails.helpers.classWaitingListSignups.destroy.with({
      waitingListSignup: waitingListSignup,
    });

    assert.equal(
      result,
      'Waiting list signup already cancelled.',
    );

    await ClassWaitingListSignup.destroy({id: waitingListSignup.id});

  });

  it('should refund class to class pass if no-shows are disabled', async () => {

    const classPass = await ClassPass.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      class_pass_type: fixtures.classPassTypeYogaTenClasses.id,
      classes_left: 5,
    }).fetch();

    const signup = await ClassWaitingListSignup.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      'class': class1.id,
      used_class_pass: classPass.id,
    }).fetch();

    MockDate.set(moment.tz('2018-05-15 11:59:58', 'Europe/Copenhagen'));

    const result = await sails.helpers.classWaitingListSignups.destroy.with({
      waitingListSignup: signup,
    });

    assert.equal(
      result,
      'Waiting list signup cancelled.',
    );
    const updatedWaitingListSignup = await ClassWaitingListSignup.findOne(signup.id);

    expect(updatedWaitingListSignup).to.matchPattern(`{
      archived: false,
      cancelled_at: _.isGreaterThan|0,
      ...
    }`);

    const updatedClassPass = await ClassPass.findOne(classPass.id);

    assert.equal(
      updatedClassPass.classes_left,
      6,
    );

    await ClassWaitingListSignup.destroy({id: signup.id});

  });

  it('should refund class to class pass if no-show are enabled and deadline has not been exceeded', async () => {

    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'no_show_fees_enabled',
      value: 1,
    }).fetch();

    const classPass = await ClassPass.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      class_pass_type: fixtures.classPassTypeYogaTenClasses.id,
      classes_left: 5,
    }).fetch();

    const signup = await ClassWaitingListSignup.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      'class': class1.id,
      used_class_pass: classPass.id,
    }).fetch();

    // Deadline is 2 hours = 2018-05-15 10:00:00
    MockDate.set(moment.tz('2018-05-15 09:59:58', 'Europe/Copenhagen'));

    const result = await sails.helpers.classWaitingListSignups.destroy.with({
      waitingListSignup: signup,
    });

    assert.equal(
      result,
      'Waiting list signup cancelled.',
    );
    const updatedWaitingListSignup = await ClassWaitingListSignup.findOne(signup.id);

    expect(updatedWaitingListSignup).to.matchPattern(`{
      archived: false,
      cancelled_at: _.isGreaterThan|0,
      ...
    }`);

    const updatedClassPass = await ClassPass.findOne(classPass.id);

    assert.equal(
      updatedClassPass.classes_left,
      6,
    );

    await ClassWaitingListSignup.destroy({id: signup.id});
    await ClientSettings.destroy({id: clientSettingsRow.id});

  });

});
