const assert = require('assert')

const assertAsyncThrows = require('../../../utils/assert-async-throws')

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID
const fixtures = require('../../../fixtures/factory').fixtures

const MockDate = require('mockdate')

describe('helpers.classWaitingListSignups.refundClassPassForWaitingListSignup', async function () {


  it('should return {classPassWasRefunded: false} if no class pass was used', async () => {

    const signup = await ClassWaitingListSignup.create({
      client: testClientId,
    }).fetch()

    const result = await sails.helpers.classWaitingListSignups.refundClassPassForWaitingListSignup.with({
      waitingListSignup: signup,
    })

    assert.deepEqual(
      result,
      {
        classPassWasRefunded: false,
      },
    );

    await ClassSignup.destroy({id: signup.id})

  })


  it('should throw "originalClassPassGone" if the class pass is not in the database', async () => {

    const signup = await ClassWaitingListSignup.create({
      used_class_pass: 999999,
    }).fetch()

    await assertAsyncThrows(
      async () => {
        await sails.helpers.classWaitingListSignups.refundClassPassForWaitingListSignup.with({
          waitingListSignup: signup,
        })
      },
      'originalClassPassGone',
    )

    await ClassSignup.destroy({id: signup.id})

  })


  it('should return "Class pass has been archived. No action taken." if class pass is archived', async () => {

    const classPass = await ClassPass.create({
      class_pass_type: fixtures.classPassTypeYogaTenClasses.id,
      classes_left: 5,
      valid_until: '2018-05-31',
      archived: true,
    }).fetch()

    const waitingListSignup = await ClassWaitingListSignup.create({
      used_class_pass: classPass.id,
    }).fetch()

    const result = await sails.helpers.classWaitingListSignups.refundClassPassForWaitingListSignup.with({
      waitingListSignup: waitingListSignup,
    })

    assert.deepEqual(
      result,
      {
        classPassWasRefunded: false,
        reasonForNotRefunding: 'classPassIsArchived',
        localizedReasonForNotRefunding: 'Class pass is archived.'
      }
    );

    await ClassWaitingListSignup.destroy({id: waitingListSignup.id})
    await ClassPass.destroy({id: classPass.id})

  })

  it('should return "Class pass has expired. No action taken." if class pass is expired', async () => {

    const classPass = await ClassPass.create({
      class_pass_type: fixtures.classPassTypeYogaTenClasses.id,
      classes_left: 5,
      valid_until: '2018-04-30',
    }).fetch()

    const waitingListSignup = await ClassWaitingListSignup.create({
      used_class_pass: classPass.id,
    }).fetch()

    const result = await sails.helpers.classWaitingListSignups.refundClassPassForWaitingListSignup.with({
      waitingListSignup: waitingListSignup,
    })

    assert.deepEqual(
      result,
      {
        classPassWasRefunded: false,
        reasonForNotRefunding: 'classPassHasExpired',
        localizedReasonForNotRefunding: 'Class pass has expired.'
      }
    );

    await ClassSignup.destroy({id: waitingListSignup.id})
    await ClassPass.destroy({id: classPass.id})

  })


  it('should return "Class pass is not fixed_count." if class pass is not fixed_count', async () => {

    MockDate.set(new Date('5/10/2018'))

    const classPass = await ClassPass.create({
      class_pass_type: fixtures.classPassTypeYogaUnlimitedOneMonth.id,
      valid_until: '2018-05-31',
    }).fetch()

    const waitingListSignup = await ClassWaitingListSignup.create({
      used_class_pass: classPass.id,
    }).fetch()

    const result = await sails.helpers.classWaitingListSignups.refundClassPassForWaitingListSignup.with({
      waitingListSignup: waitingListSignup,
    })

    assert.deepEqual(
      result,
      {
        classPassWasRefunded: false,
        reasonForNotRefunding: 'classPassIsUnlimited',
        localizedReasonForNotRefunding: 'Class pass is unlimited.'
      }
    );

    await ClassWaitingListSignup.destroy({id: waitingListSignup.id})
    await ClassPass.destroy({id: classPass.id})

    MockDate.reset()

  })

  it('should update class pass and return "Class pass updated with 1 extra class."', async () => {

    MockDate.set(new Date('5/10/2018'))

    const classPass = await ClassPass.create({
      class_pass_type: fixtures.classPassTypeYogaTenClasses.id,
      classes_left: 5,
      valid_until: '2018-05-31',
    }).fetch()

    const waitingListSignup = await ClassWaitingListSignup.create({
      used_class_pass: classPass.id,
    }).fetch()

    const result = await sails.helpers.classWaitingListSignups.refundClassPassForWaitingListSignup.with({
      waitingListSignup: waitingListSignup,
    })

    assert.deepEqual(
      result,
      {
        classPassWasRefunded: true,
        previousNumberOfClasses: 5,
      }
    );

    const updatedClassPass = await ClassPass.findOne(classPass.id)

    assert.equal(
      updatedClassPass.classes_left,
      6,
    )

    await ClassSignup.destroy({id: waitingListSignup.id})
    await ClassPass.destroy({id: classPass.id})

    MockDate.reset()

  })

  /*it('should use the provided transaction', async () => {

    MockDate.set(new Date('5/10/2018'))

    const classPass = await ClassPass.create({
      class_pass_type: fixtures.classPassTypeYogaTenClasses.id,
      classes_left: 5,
      valid_until: '2018-05-31',
    }).fetch()

    const waitingListSignup = await ClassWaitingListSignup.create({
      used_class_pass: classPass.id,
    }).fetch()

    const trx = await sails.helpers.knex.getPromisifiedTransaction()

    const result = await sails.helpers.classWaitingListSignups.refundClassPassForWaitingListSignup(waitingListSignup, trx)

    assert.equal(
      result,
      'Class pass updated with 1 extra class.',
    )

    let classPassInDbWithAnotherConnection = await ClassPass.findOne(classPass.id)

    assert.strictEqual(
      classPassInDbWithAnotherConnection.classes_left,
      5,
    )

    await trx.commit()

    classPassInDbWithAnotherConnection = await ClassPass.findOne(classPass.id)

    assert.strictEqual(
      classPassInDbWithAnotherConnection.classes_left,
      6,
    )

    await ClassSignup.destroy({id: waitingListSignup.id})
    await ClassPass.destroy({id: classPass.id})

    MockDate.reset()

  })*/

})
