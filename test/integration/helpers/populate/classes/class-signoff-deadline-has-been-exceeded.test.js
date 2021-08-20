const testClientId = require('../../../../global-test-variables').TEST_CLIENT_ID;
const assert = require('assert');

const MockDate = require('mockdate');
const moment = require('moment-timezone');

describe('helpers.populate.classes.class-signoff-deadline-has-been-exceeded', async function () {

  beforeEach(async () => {
    await ClientSettings.destroy({});
  })

  it('should return an empty array if input is empty', async () => {

    const result = await sails.helpers.populate.classes.classSignoffDeadlineHasBeenExceeded([]);

    assert(_.isArray(result) && result.length === 0);

  });


  it('should return input array unchanged if input is already populated', async () => {

    const classes = [
      {
        class_signoff_deadline_has_been_exceeded: true,
      },
      {
        class_signoff_deadline_has_been_exceeded: false,
      },
    ];

    await sails.helpers.populate.classes.classSignoffDeadlineHasBeenExceeded(classes);

    assert.deepStrictEqual(
      classes,
      [{
        class_signoff_deadline_has_been_exceeded: true,
      },
      {
        class_signoff_deadline_has_been_exceeded: false,
      }]
    );

  });

  it('should populate class, no-show fees disabled', async () => {

    const classObj = await Class.create({
      client: testClientId,
      date: '2020-06-16',
      start_time: '12:00:00',
      seats: 20,
    }).fetch();

    const classCopy1 = _.cloneDeep(classObj);

    MockDate.set(moment.tz('2020-06-16 11:59:59', 'Europe/Copenhagen'));

    await sails.helpers.populate.classes.classSignoffDeadlineHasBeenExceeded([classCopy1]);

    expect(classCopy1).to.matchPattern(`           
        {
          class_signoff_deadline_has_been_exceeded: false,
          ...
        }`,
    );

    const classCopy2 = _.cloneDeep(classObj);

    MockDate.set(moment.tz('2020-06-16 12:00:00', 'Europe/Copenhagen'));

    await sails.helpers.populate.classes.classSignoffDeadlineHasBeenExceeded([classCopy2]);

    expect(classCopy2).to.matchPattern(`           
        {
          class_signoff_deadline_has_been_exceeded: true,
          ...
        }`,
    );

    MockDate.reset();

  });

  it('should populate private class, no-show fees disabled', async () => {

    const classObj = await Class.create({
      client: testClientId,
      date: '2020-06-16',
      start_time: '12:00:00',
      seats: 1,
    }).fetch();

    const classCopy1 = _.cloneDeep(classObj);

    MockDate.set(moment.tz('2020-06-16 11:59:59', 'Europe/Copenhagen'));

    await sails.helpers.populate.classes.classSignoffDeadlineHasBeenExceeded([classCopy1]);

    expect(classCopy1).to.matchPattern(`           
        {
          class_signoff_deadline_has_been_exceeded: false,
          ...
        }`,
    );

    const classCopy2 = _.cloneDeep(classObj);

    MockDate.set(moment.tz('2020-06-16 12:00:00', 'Europe/Copenhagen'));

    await sails.helpers.populate.classes.classSignoffDeadlineHasBeenExceeded([classCopy2]);

    expect(classCopy2).to.matchPattern(`           
        {
          class_signoff_deadline_has_been_exceeded: true,
          ...
        }`,
    );

    MockDate.reset();

  });

});


