/**
 *
 * UNDER CONSTRUCTION
 *
 */


const fixtures = require('../../../fixtures/factory').fixtures;

describe('belongs-to-one-relation', async () => {

  afterEach(() => {

  });

  it('should return empty array if input is empty array', async () => {

    const collection = [];

    await sails.helpers.populate.belongsToOneRelation(
      collection,
      'membership_type',
      'MembershipType',
    );

    expect(collection).to.matchPattern([]);

  });

  it('should return input collection if already populated', async () => {

    const collection = [
      {
        id: 2,
        membership_type: {id: 4},
      },
      {
        id: 3,
        membership_type: {id: 5},
      },
    ];

    await sails.helpers.populate.belongsToOneRelation(
      collection,
      'membership_type',
      'MembershipType',
    );

    expect(collection).to.matchPattern([
      {
        id: 2,
        membership_type: {id: 4},
      },
      {
        id: 3,
        membership_type: {id: 5},
      },
    ]);

  });

  it('should populate belongs-to-one relation', async () => {

    const collection = [
      {
        membership_type: fixtures.membershipTypeYogaUnlimited.id,
      },
      {
        membership_type: null,
      },
    ];

    await sails.helpers.populate.belongsToOneRelation(
      collection,
      'membership_type',
      'MembershipType',
    );

    expect(collection).to.matchPattern(`[
      {
        membership_type: {id: ${fixtures.membershipTypeYogaUnlimited.id}, ...},
        membership_type_id: ${fixtures.membershipTypeYogaUnlimited.id},
      },
      {
        membership_type: null
      },
    ]`);

  });

  it('should populate belongs-to-one relation, separate id property', async () => {

    const collection = [
      {
        membership_type_id: fixtures.membershipTypeYogaUnlimited.id,
      },
      {
        membership_type_id: null,
      },
    ];

    await sails.helpers.populate.belongsToOneRelation(
      collection,
      'membership_type',
      'MembershipType',
    );

    expect(collection).to.matchPattern(`[
      {
        membership_type: {id: ${fixtures.membershipTypeYogaUnlimited.id}, ...},
        membership_type_id: ${fixtures.membershipTypeYogaUnlimited.id},
      },
      {
        membership_type: null,
        membership_type_id: null
      },
    ]`);

  });

  it('should do nothing if there are no values to populate', async () => {

    const collection = [
      {
        membership_type: null,
      },
      {
        membership_type: null,
      },
    ];

    await sails.helpers.populate.belongsToOneRelation(
      collection,
      'membership_type',
      'MembershipType',
    );

    expect(collection).to.matchPattern(`[
      {
        membership_type: null,
      },
      {
        membership_type: null,
      },
    ]`);

  });

  it('should do nothing if there are no values to populate, separate id property', async () => {

    const collection = [
      {
        membership_type_id: null,
      },
      {
        membership_type_id: null,
      },
    ];

    await sails.helpers.populate.belongsToOneRelation(
      collection,
      'membership_type',
      'MembershipType',
    );

    expect(collection).to.matchPattern(`[
      {
        membership_type_id: null,
      },
      {
        membership_type_id: null,
      },
    ]`);

  });

});
