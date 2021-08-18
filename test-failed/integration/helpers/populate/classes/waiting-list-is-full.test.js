const fixtures = require('../../../../fixtures/factory').fixtures;
const testClientId = require('../../../../global-test-variables').TEST_CLIENT_ID;
const assert = require('assert');

describe('helpers.populate.classes.waiting-list-is-full', async function () {

  it('should return an empty array if input is empty', async () => {

    const result = await sails.helpers.populate.classes.waitingListIsFull([]);

    assert(_.isArray(result) && result.length === 0);

  });


  it('should return input array unchanged if input is already populated', async () => {

    const classes = [
      {
        waiting_list_is_full: false,
      },
      {
        waiting_list_is_full: true,
      },
    ];

    await sails.helpers.populate.classes.waitingListIsFull(classes);

    expect(classes).to.matchPattern(`
      [
        {
          waiting_list_is_full: false,
        },
        {
          waiting_list_is_full: true,
        }
      ]
    `);

  });


  it('should populate classes', async () => {
    const classes = await Class.createEach([{
      client: testClientId,
      seats: 20,
    }, {
      client: testClientId,
      seats: 20,
    }]).fetch();

    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'class_waiting_list_max_customers_on_waiting_list',
      value: 2,
    }).fetch();

    const waitingListSignups = await ClassWaitingListSignup.createEach([
      {
        user: fixtures.userAlice.id,
        class: classes[0].id,
      },
      {
        user: fixtures.userBill.id,
        class: classes[0].id,
      },
      {
        user: fixtures.userAlice.id,
        'class': classes[1].id,
      },
      {
        user: fixtures.userBill.id,
        'class': classes[1].id,
        archived: true,
      },
      {
        user: fixtures.userBill.id,
        'class': classes[1].id,
        cancelled_at: 1234567,
      },
    ]).fetch();

    await sails.helpers.populate.classes.waitingListIsFull(classes);

    expect(classes).to.matchPattern(`
     [
       {
         id: ${classes[0].id},
         waiting_list_is_full: true,
         ...
       },
       {
         id: ${classes[1].id},
         waiting_list_is_full: false,
         ...
       }
     ]
    `);

    await ClassSignup.destroy({id: _.map(waitingListSignups, 'id')});
    await Class.destroy({id: _.map(classes, 'id')});
    await ClientSettings.destroy({id: clientSettingsRow.id});
  });

  it('should populate private classes', async () => {
    const classes = await Class.createEach([{
      client: testClientId,
      seats: 1,
    }, {
      client: testClientId,
      seats: 1,
    }]).fetch();

    const waitingListSignups = await ClassWaitingListSignup.createEach([
      {
        user: fixtures.userAlice.id,
        class: classes[0].id,
      },
      {
        user: fixtures.userBill.id,
        class: classes[0].id,
      },
      {
        user: fixtures.userAlice.id,
        'class': classes[1].id,
      },
      {
        user: fixtures.userBill.id,
        'class': classes[1].id,
        archived: true,
      },
      {
        user: fixtures.userBill.id,
        'class': classes[1].id,
        cancelled_at: 1234567,
      },
    ]).fetch();

    await sails.helpers.populate.classes.waitingListIsFull(classes);

    expect(classes).to.matchPattern(`
     [
       {
         id: ${classes[0].id},
         waiting_list_is_full: true,
         ...
       },
       {
         id: ${classes[1].id},
         waiting_list_is_full: false,
         ...
       }
     ]
    `);

    await ClassSignup.destroy({id: _.map(waitingListSignups, 'id')});
    await Class.destroy({id: _.map(classes, 'id')});
  });

  it('should populate open classes', async () => {
    const classes = await Class.createEach([{
      client: testClientId,
      seats: 0,
    }]).fetch();

    await sails.helpers.populate.classes.waitingListIsFull(classes);

    expect(classes).to.matchPattern(`
     [
       {
         id: ${classes[0].id},
         waiting_list_is_full: false,
         ...
       },       
     ]
    `);

    await Class.destroy({id: _.map(classes, 'id')});
  });

});


