const fixtures = require('../../../fixtures/factory').fixtures;

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID;

describe('has-many-relation', async () => {

  afterEach(() => {

  });

  it('should return empty array if input is empty array', async () => {

    const result = await sails.helpers.populate.hasManyRelation(
      [],
      'membership_pauses',
      'MembershipPause',
      'membership_id',
    );

    expect(result).to.matchPattern([]);

  });

  it('should return input collection if already populated', async () => {

    const inputCollection = [
      {
        id: 2,
        membership_pauses: [
          {id: 4},
        ],
      },
      {
        id: 3,
        membership_pauses: [
          {id: 5},
        ],
      },
    ];

    await sails.helpers.populate.hasManyRelation(
      inputCollection,
      'membership_pauses',
      'MembershipPause',
      'membership_id',
    );

    expect(inputCollection).to.matchPattern([
      {
        id: 2,
        membership_pauses: [
          {id: 4},
        ],
      },
      {
        id: 3,
        membership_pauses: [
          {id: 5},
        ],
      },
    ]);

  });

  it('should populate has-many relation', async () => {

    const inputCollection = _.cloneDeep([
      fixtures.membershipTypeYogaUnlimited,
      fixtures.membershipTypeYogaUnlimitedLivestream,
      fixtures.membershipTypeDance,
    ]);

    await sails.helpers.populate.hasManyRelation(
      inputCollection,
      'payment_options',
      'MembershipTypePaymentOption',
      'membership_type',
    );

    expect(inputCollection).to.matchPattern(`[
      {
        id: ${fixtures.membershipTypeYogaUnlimited.id},
        payment_options: [
          {
            id: ${fixtures.yogaUnlimitedPaymentOptionMonthly.id},
            ...
          },
          {
            id: ${fixtures.yogaUnlimitedPaymentOptionSemiannually.id},
            ...
          },
          {
            id: ${fixtures.yogaUnlimitedPaymentOptionYearly.id},
            ...
          },
        ],
        ...
      },
      {
        id: ${fixtures.membershipTypeYogaUnlimitedLivestream.id},
        payment_options: [
          {
            id: ${fixtures.yogaUnlimitedLivestreamPaymentOptionMonthly.id},
            ...
          },          
        ],
        ...
      },
      {
        id: ${fixtures.membershipTypeDance.id},
        payment_options: [],
        ...
      }
    ]`);

  });

  it('should return dates as format YYYY-MM-DD', async () => {

    const membership = await Membership.create({
      client: testClientId,
    }).fetch();

    const membershipPause = await MembershipPause.create({
      membership_id: membership.id,
      client_id: testClientId,
      start_date: '2020-05-01',
      end_date: '2020-05-02'
    }).fetch();

    await sails.helpers.populate.hasManyRelation(
      [membership],
      'membership_pauses',
      'MembershipPause',
      'membership_id',
    );

    expect(membership).to.matchPattern(`
    {
      client: ${testClientId},
      membership_pauses: [{
        start_date: '2020-05-01',
        end_date: '2020-05-02',
        ...
      }],
      ...
    }
    `);

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: membershipPause.id});

  })

});
