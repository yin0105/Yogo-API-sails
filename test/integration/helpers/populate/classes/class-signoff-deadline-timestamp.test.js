const fixtures = require('../../../../fixtures/factory').fixtures;
const testClientId = require('../../../../global-test-variables').TEST_CLIENT_ID;
const assert = require('assert');

describe('helpers.populate.classes.class-signoff-deadline-timestamp', async function () {

  it('should return an empty array if input is empty', async () => {

    const result = await sails.helpers.populate.classes.classSignoffDeadlineTimestamp([]);

    assert(_.isArray(result) && result.length === 0);

  });


  it('should return input array unchanged if input is already populated', async () => {

    const classes = [{
      class_signoff_deadline_timestamp: 123456,
    }, {
      class_signoff_deadline_timestamp: 654321,
    }];

    await sails.helpers.populate.classes.classSignoffDeadlineTimestamp(classes);

    assert.deepStrictEqual(
      classes,
      [
      {
        class_signoff_deadline_timestamp: 123456,
      }, {
        class_signoff_deadline_timestamp: 654321,
      },
    ]);

  });

  it('should populate signups for classes, no-show fees enabled', async () => {

    const classObj = await Class.create(
      {
        client: testClientId,
        date: '2020-06-16',
        start_time: '12:00:00',
        end_time: '14:00:00',
        seats: 20,
      }
      ).fetch();

    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'no_show_fees_enabled',
      value: 1,
    }).fetch();

    await sails.helpers.populate.classes.classSignoffDeadlineTimestamp([classObj]);

    expect(classObj).to.matchPattern(`
        {
          class_signoff_deadline_timestamp: '1592294400000',
          ...
        }        
      `
    ); // 2020-06-16 10:00:00

    await Class.destroy({id: classObj.id});
    await ClientSettings.destroy({id: clientSettingsRow.id});

  });

  it('should populate signups for private classes, no-show fees enabled', async () => {

    const classObj = await Class.create(
      {
        client: testClientId,
        date: '2020-06-16',
        start_time: '12:00:00',
        end_time: '14:00:00',
        seats: 1,
      }
    ).fetch();

    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'no_show_fees_enabled',
      value: 1,
    }).fetch();

    await sails.helpers.populate.classes.classSignoffDeadlineTimestamp([classObj]);

    expect(classObj).to.matchPattern(`
      {
        class_signoff_deadline_timestamp: '1592215200000',
        ...
      }        
    `
    ); // 2020-06-15 12:00:00

    await Class.destroy({id: classObj.id});
    await ClientSettings.destroy({id: clientSettingsRow.id});

  });

  it('should populate signups for classes, no-show fees disabled', async () => {

    const classObj = await Class.create(
      {
        client: testClientId,
        date: '2020-06-16',
        start_time: '12:00:00',
        end_time: '14:00:00',
        seats: 20,
      }
    ).fetch();

    await sails.helpers.populate.classes.classSignoffDeadlineTimestamp([classObj]);

    expect(classObj).to.matchPattern(`      
      {
        class_signoff_deadline_timestamp: '1592301600000',
        ...
      }`
    ); // 2020-06-16 12:00:00

    await Class.destroy({id: classObj.id});

  });

  it('should populate signups for private classes, no-show fees disabled', async () => {

    const classObj = await Class.create(
      {
        client: testClientId,
        date: '2020-06-16',
        start_time: '12:00:00',
        end_time: '14:00:00',
        seats: 1,
      }
    ).fetch();

    await sails.helpers.populate.classes.classSignoffDeadlineTimestamp([classObj]);

    expect(classObj).to.matchPattern(`     
        {
          class_signoff_deadline_timestamp: '1592301600000',
          ...
        }        
      `
    ); // 2020-06-16 12:00:00

    await Class.destroy({id: classObj.id});

  });

  it('should use different deadlines for different clients', async () => {

    const classes = await Class.createEach([
      {
        client: testClientId,
        date: '2020-06-16',
        start_time: '12:00:00',
        seats: 20,
      },
      {
        client: testClientId,
        date: '2020-06-16',
        start_time: '12:00:00',
        seats: 1,
      },
      {
        client: fixtures.testClient2.id,
        date: '2020-06-16',
        start_time: '12:00:00',
        seats: 20,
      },
      {
        client: fixtures.testClient2.id,
        date: '2020-06-16',
        start_time: '12:00:00',
        seats: 1,
      },
      {
        client: fixtures.testClient3.id,
        date: '2020-06-16',
        start_time: '12:00:00',
        seats: 20,
      },
      {
        client: fixtures.testClient3.id,
        date: '2020-06-16',
        start_time: '12:00:00',
        seats: 1,
      },
    ]).fetch();

    const settingsRows = await ClientSettings.createEach([
      {
        client: fixtures.testClient2.id,
        key: 'no_show_fees_enabled',
        value: 1,
      },
      {
        client: fixtures.testClient2.id,
        key: 'class_signoff_deadline',
        value: 720,
      },
      {
        client: fixtures.testClient2.id,
        key: 'private_class_signoff_deadline',
        value: 2880,
      },
      {
        client: fixtures.testClient3.id,
        key: 'no_show_fees_enabled',
        value: 1,
      },
      {
        client: fixtures.testClient3.id,
        key: 'class_signoff_deadline',
        value: 60,
      },
      {
        client: fixtures.testClient3.id,
        key: 'private_class_signoff_deadline',
        value: 240,
      },
    ]).fetch();

    await sails.helpers.populate.classes.classSignoffDeadlineTimestamp(classes);

    expect(classes).to.matchPattern(`
      [
        {
          id: ${classes[0].id},
          class_signoff_deadline_timestamp: '1592301600000', 
          ...
        },
        {
          id: ${classes[1].id},
          class_signoff_deadline_timestamp: '1592301600000', 
          ...
        },
        {
          id: ${classes[2].id},
          class_signoff_deadline_timestamp: '1592258400000', 
          ...
        },
        {
          id: ${classes[3].id},
          class_signoff_deadline_timestamp: '1592128800000', 
          ...
        },
        {
          id: ${classes[4].id},
          class_signoff_deadline_timestamp: '1592298000000', 
          ...
        },
        {
          id: ${classes[5].id},
          class_signoff_deadline_timestamp: '1592287200000', 
          ...
        }    
      ]
    `);
    // 2020-06-16 12:00:00
    // 2020-06-16 12:00:00
    // 2020-06-16 00:00:00
    // 2020-06-14 12:00:00
    // 2020-06-16 11:00:00
    // 2020-06-16 08:00:00

    await Class.destroy({id: _.map(classes, 'id')});
    await ClientSettings.destroy({id: _.map(settingsRows, 'id')});

  });

});


