const testClientId = require('../../../../global-test-variables').TEST_CLIENT_ID;
const fixtures = require('../../../../fixtures/factory').fixtures;

describe('helpers.populate.users.video-groups-that-customer-can-access (INCOMPLETE)', async () => {

  it('should return empty array if input is empty', async () => {

    const result = await sails.helpers.populate.users.videoGroupsThatCustomerCanAccess([]);

    expect(result).to.matchPattern([]);

  });

  it('should return input unchanged if already populated', async () => {

    const users = [
      {
        video_groups_that_customer_can_access: [
          {id: 1},
        ],
      },
      {
        video_groups_that_customer_can_access: [],
      },
    ];

    await sails.helpers.populate.users.videoGroupsThatCustomerCanAccess(users);

    expect(users).to.matchPattern([
      {
        video_groups_that_customer_can_access: [
          {id: 1},
        ],
      },
      {
        video_groups_that_customer_can_access: [],
      },
    ]);

  });

  it('should populate based on public video groups', async () => {

    const videoGroups = await VideoGroup.createEach([
      {
        client: testClientId,
        name: 'Public 1',
        public_access: true,
      },
      {
        client: testClientId,
        name: 'Secret 1',
        public_access: false,
      },
      {
        client: testClientId,
        name: 'Public 2',
        public_access: true,
      },
    ]).fetch();

    const users = _.cloneDeep([
      fixtures.userAlice,
      fixtures.userBill,
    ]);

    await sails.helpers.populate.users.videoGroupsThatCustomerCanAccess(users);

    expect(users).to.matchPattern(`[
      {
        id: ${fixtures.userAlice.id},
        video_groups_that_customer_can_access: [
          {id: ${videoGroups[0].id}, ...},
          {id: ${videoGroups[2].id}, ...},
        ],
        ...
      },
      {
        id: ${fixtures.userBill.id},
        video_groups_that_customer_can_access: [
          {id: ${videoGroups[0].id}, ...},
          {id: ${videoGroups[2].id}, ...},
        ],
        ...
      },
    ]`);

    await VideoGroup.destroy({id: _.map(videoGroups, 'id')});

  });

  it('should populate based on public video groups, with Objection style client ID', async () => {

    const videoGroups = await VideoGroup.createEach([
      {
        client: testClientId,
        name: 'Public 1',
        public_access: true,
      },
    ]).fetch();

    const users = [{
      id: fixtures.userAlice.id,
      client_id: testClientId,
    }];

    await sails.helpers.populate.users.videoGroupsThatCustomerCanAccess(users);

    expect(users).to.matchPattern(`[
      {
        client_id: ${testClientId},
        video_groups_that_customer_can_access: [
          {id: ${videoGroups[0].id}, ...},
        ],
        ...
      },      
    ]`);

    await VideoGroup.destroy({id: _.map(videoGroups, 'id')});

  });

  it('should populate based on public video groups, with client as object', async () => {

    const videoGroups = await VideoGroup.createEach([
      {
        client: testClientId,
        name: 'Public 1',
        public_access: true,
      },
    ]).fetch();

    const users = [{
      id: fixtures.userAlice.id,
      client: {id: testClientId},
    }];

    await sails.helpers.populate.users.videoGroupsThatCustomerCanAccess(users);

    expect(users).to.matchPattern(`[
      {
        client: {id: ${testClientId}, ...},
        video_groups_that_customer_can_access: [
          {id: ${videoGroups[0].id}, ...},
        ],
        ...
      },      
    ]`);

    await VideoGroup.destroy({id: _.map(videoGroups, 'id')});

  });

});
