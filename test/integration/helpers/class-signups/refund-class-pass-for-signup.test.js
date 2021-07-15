const assert = require('assert');

const assertAsyncThrows = require('../../../utils/assert-async-throws');

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID;
const fixtures = require('../../../fixtures/factory').fixtures;

const MockDate = require('mockdate');

describe('helpers.classSignups.refundClassPassForSignup', async function () {

  let class1;

  before(async () => {

    class1 = await Class.create({
      date: '2018-05-15',
      start_time: '12:00:00',
      end_time: '14:00:00',
      client: testClientId,
    }).fetch();

  });

  after(async () => {

    await Class.destroy({
      id: class1.id,
    });

  });

  it('should return "No class pass used for signup" if no class pass was used', async () => {

    const signup = await ClassSignup.create({
      client: testClientId,
      'class': class1.id,
      user: fixtures.userAlice.id,
    }).fetch();

    const result = await sails.helpers.classSignups.refundClassPassForSignup.with({
      signup: signup,
    });

    expect(result).to.matchPattern({
      classPassWasRefunded: false,
    });

    await ClassSignup.destroy({id: signup.id});

  });


  it('should throw "originalClassPassGone" if the class pass is not in the database', async () => {

    const signup = await ClassSignup.create({
      client: testClientId,
      'class': class1.id,
      user: fixtures.userAlice.id,
      used_class_pass: 999999,
    }).fetch();

    await assertAsyncThrows(
      async () => {
        await sails.helpers.classSignups.refundClassPassForSignup.with({
          signup: signup,
        });
      },
      'originalClassPassGone',
    );

    await ClassSignup.destroy({id: signup.id});

  });


  it('should return "Class pass has been archived. No action taken." if class pass is archived', async () => {

    const classPass = await ClassPass.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      class_pass_type: fixtures.classPassTypeYogaUnlimitedOneMonth.id,
      valid_until: '2018-05-31',
      archived: true,
    }).fetch();

    const signup = await ClassSignup.create({
      client: testClientId,
      'class': class1.id,
      user: fixtures.userAlice.id,
      used_class_pass: classPass.id,
    }).fetch();

    const result = await sails.helpers.classSignups.refundClassPassForSignup.with({
      signup: signup,
    });

    expect(result).to.matchPattern({
      classPassWasRefunded: false,
      reasonForNotRefunding: 'classPassIsArchived',
      localizedReasonForNotRefunding: 'Class pass is archived.',
    });

    await ClassSignup.destroy({id: signup.id});
    await ClassPass.destroy({id: classPass.id});

  });

  it('should return "Class pass has expired. No action taken." if class pass is expired', async () => {

    const classPass = await ClassPass.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      class_pass_type: fixtures.classPassTypeYogaTenClasses.id,
      classes_left: 5,
      valid_until: '2018-04-30',
    }).fetch();

    const signup = await ClassSignup.create({
      client: testClientId,
      'class': class1.id,
      user: fixtures.userAlice.id,
      used_class_pass: classPass.id,
    }).fetch();

    const result = await sails.helpers.classSignups.refundClassPassForSignup.with({
      signup: signup,
    });

    expect(result).to.matchPattern({
      classPassWasRefunded: false,
      reasonForNotRefunding: 'classPassHasExpired',
      localizedReasonForNotRefunding: 'Class pass has expired.',
    });

    await ClassSignup.destroy({id: signup.id});
    await ClassPass.destroy({id: classPass.id});

  });


  it('should return "Class pass is not fixed_count." if class pass is not fixed_count', async () => {

    MockDate.set(new Date('5/10/2018'));

    const classPass = await ClassPass.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      class_pass_type: fixtures.classPassTypeYogaUnlimitedOneMonth.id,
      valid_until: '2018-05-31',
    }).fetch();

    const signup = await ClassSignup.create({
      client: testClientId,
      'class': class1.id,
      user: fixtures.userAlice.id,
      used_class_pass: classPass.id,
    }).fetch();

    const result = await sails.helpers.classSignups.refundClassPassForSignup.with({
      signup: signup,
    });

    expect(result).to.matchPattern({
      classPassWasRefunded: false,
      reasonForNotRefunding: 'classPassIsUnlimited',
      localizedReasonForNotRefunding: 'Class pass is unlimited.',
    });

    await ClassSignup.destroy({id: signup.id});
    await ClassPass.destroy({id: classPass.id});

    MockDate.reset();

  });

  it('should update class pass and return "Class pass updated with 1 extra class."', async () => {

    MockDate.set(new Date('5/10/2018'));

    const classPass = await ClassPass.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      class_pass_type: fixtures.classPassTypeYogaTenClasses.id,
      classes_left: 5,
      valid_until: '2018-05-31',
    }).fetch();

    const signup = await ClassSignup.create({
      client: testClientId,
      'class': class1.id,
      user: fixtures.userAlice.id,
      used_class_pass: classPass.id,
    }).fetch();

    const result = await sails.helpers.classSignups.refundClassPassForSignup.with({
      signup: signup,
    });

    expect(result).to.matchPattern({
      classPassWasRefunded: true,
      previousNumberOfClasses: 5,
    });

    const updatedClassPass = await ClassPass.findOne(classPass.id);

    assert.equal(
      updatedClassPass.classes_left,
      6,
    );

    await ClassSignup.destroy({id: signup.id});
    await ClassPass.destroy({id: classPass.id});

    MockDate.reset();

  });


});
