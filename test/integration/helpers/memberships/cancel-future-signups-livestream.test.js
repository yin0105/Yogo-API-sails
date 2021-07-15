const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID;
const fixtures = require('../../../fixtures/factory').fixtures;

describe('helpers.memberships.cancel-future-signups-livestream', async function () {

  let membership;

  before(async () => {
    await ClassLivestreamSignup.destroy({});
    membership = await Membership.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      status: 'active',
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
    }).fetch();
  });

  after(async () => {
    await Membership.destroy({id: membership.id});
  });

  it('should cancel class livestream signups with no startTime specified', async () => {

    const classes = await Class.createEach([
      {
        client: testClientId,
        date: '2020-05-15',
        start_time: '12:00:00',
        end_time: '14:00:00',
        class_type: fixtures.classTypeYoga.id,
      },
      {
        client: testClientId,
        date: '2020-05-15',
        start_time: '23:59:59',
        end_time: '02:00:00',
        class_type: fixtures.classTypeYoga.id,
      },
      {
        client: testClientId,
        date: '2020-05-16',
        start_time: '00:00:00',
        end_time: '02:00:00',
        class_type: fixtures.classTypeYoga.id,
      },
      {
        client: testClientId,
        date: '2020-05-16',
        start_time: '12:00:00',
        end_time: '14:00:00',
        class_type: fixtures.classTypeYoga.id,
      },
      {
        client: testClientId,
        date: '2020-05-17',
        start_time: '00:00:00',
        end_time: '02:00:00',
        class_type: fixtures.classTypeYoga.id,
      },
    ]).fetch();

    await ClassLivestreamSignup.createEach([
      {
        client: testClientId,
        class: classes[0].id,
        user: fixtures.userAlice.id,
        used_membership: membership.id
      },
      {
        client: testClientId,
        class: classes[1].id,
        user: fixtures.userAlice.id,
        used_membership: membership.id
      },
      {
        client: testClientId,
        class: classes[2].id,
        user: fixtures.userAlice.id,
        used_membership: membership.id
      },
      {
        client: testClientId,
        class: classes[3].id,
        user: fixtures.userAlice.id,
        used_membership: membership.id
      },
      {
        client: testClientId,
        class: classes[4].id,
        user: fixtures.userAlice.id,
        used_membership: membership.id
      },
      {
        client: testClientId,
        class: classes[4].id,
        user: fixtures.userAlice.id,
        used_membership: membership.id + 1
      },
    ])

    const timestampBeforeCall = Date.now() - 1;
    await sails.helpers.memberships.cancelFutureSignups.with({
      membership: membership,
      startDate: '2020-05-16',
      userGetsRefundAfterDeadline: true,
    });
    const timestampAfterCall = Date.now() + 1;

    let dbSignups = await ClassLivestreamSignup.find({});

    dbSignups = _.map(dbSignups, cs => _.pick(cs, ['class','user','used_membership', 'cancelled_at', 'archived']));

    expect(dbSignups).to.matchPattern(`[
      {
        class: ${classes[0].id},
        user: ${fixtures.userAlice.id},
        used_membership: ${membership.id},
        cancelled_at: 0,
        archived: false
      },
      {
        class: ${classes[1].id},
        user: ${fixtures.userAlice.id},
        used_membership: ${membership.id},
        cancelled_at: 0,
        archived: false
      },
      {
        class: ${classes[2].id},
        user: ${fixtures.userAlice.id},
        used_membership: ${membership.id},
        cancelled_at: _.isBetween|${timestampBeforeCall}|${timestampAfterCall},
        archived: false
      },
      {
        class: ${classes[3].id},
        user: ${fixtures.userAlice.id},
        used_membership: ${membership.id},
        cancelled_at: _.isBetween|${timestampBeforeCall}|${timestampAfterCall},
        archived: false
      },
      {
        class: ${classes[4].id},
        user: ${fixtures.userAlice.id},
        used_membership: ${membership.id},
        cancelled_at: _.isBetween|${timestampBeforeCall}|${timestampAfterCall},
        archived: false
      },
      {
        class: ${classes[4].id},
        user: ${fixtures.userAlice.id},
        used_membership: ${membership.id + 1},
        cancelled_at: 0,
        archived: false
      },
    ]`);

    await Class.destroy({});
    await ClassLivestreamSignup.destroy({});

  });


  it('should cancel class livestream signups with startTime specified', async () => {

    const classes = await Class.createEach([
      {
        client: testClientId,
        date: '2020-05-15',
        start_time: '12:00:00',
        end_time: '14:00:00',
        class_type: fixtures.classTypeYoga.id,
      },
      {
        client: testClientId,
        date: '2020-05-15',
        start_time: '23:59:59',
        end_time: '02:00:00',
        class_type: fixtures.classTypeYoga.id,
      },
      {
        client: testClientId,
        date: '2020-05-16',
        start_time: '11:59:59',
        end_time: '14:00:00',
        class_type: fixtures.classTypeYoga.id,
      },
      {
        client: testClientId,
        date: '2020-05-16',
        start_time: '12:00:00',
        end_time: '14:00:00',
        class_type: fixtures.classTypeYoga.id,
      },
      {
        client: testClientId,
        date: '2020-05-17',
        start_time: '00:00:00',
        end_time: '02:00:00',
        class_type: fixtures.classTypeYoga.id,
      },
    ]).fetch();

    await ClassLivestreamSignup.createEach([
      {
        client: testClientId,
        class: classes[0].id,
        user: fixtures.userAlice.id,
        used_membership: membership.id
      },
      {
        client: testClientId,
        class: classes[1].id,
        user: fixtures.userAlice.id,
        used_membership: membership.id
      },
      {
        client: testClientId,
        class: classes[2].id,
        user: fixtures.userAlice.id,
        used_membership: membership.id
      },
      {
        client: testClientId,
        class: classes[3].id,
        user: fixtures.userAlice.id,
        used_membership: membership.id
      },
      {
        client: testClientId,
        class: classes[4].id,
        user: fixtures.userAlice.id,
        used_membership: membership.id
      },
      {
        client: testClientId,
        class: classes[4].id,
        user: fixtures.userAlice.id,
        used_membership: membership.id + 1
      },
    ])

    const timestampBeforeCall = Date.now() - 1;
    await sails.helpers.memberships.cancelFutureSignups.with({
      membership: membership,
      startDate: '2020-05-16',
      startTime: '12:00:00',
      userGetsRefundAfterDeadline: true,
    });
    const timestampAfterCall = Date.now() + 1;

    let dbSignups = await ClassLivestreamSignup.find({});

    dbSignups = _.map(dbSignups, cs => _.pick(cs, ['class','user','used_membership', 'cancelled_at', 'archived']));

    expect(dbSignups).to.matchPattern(`[
      {
        class: ${classes[0].id},
        user: ${fixtures.userAlice.id},
        used_membership: ${membership.id},
        cancelled_at: 0,
        archived: false
      },
      {
        class: ${classes[1].id},
        user: ${fixtures.userAlice.id},
        used_membership: ${membership.id},
        cancelled_at: 0,
        archived: false
      },
      {
        class: ${classes[2].id},
        user: ${fixtures.userAlice.id},
        used_membership: ${membership.id},
        cancelled_at: 0,
        archived: false
      },
      {
        class: ${classes[3].id},
        user: ${fixtures.userAlice.id},
        used_membership: ${membership.id},
        cancelled_at: _.isBetween|${timestampBeforeCall}|${timestampAfterCall},
        archived: false
      },
      {
        class: ${classes[4].id},
        user: ${fixtures.userAlice.id},
        used_membership: ${membership.id},
        cancelled_at: _.isBetween|${timestampBeforeCall}|${timestampAfterCall},
        archived: false
      },
      {
        class: ${classes[4].id},
        user: ${fixtures.userAlice.id},
        used_membership: ${membership.id + 1},
        cancelled_at: 0,
        archived: false
      },
    ]`);

    await Class.destroy({});
    await ClassLivestreamSignup.destroy({});

  });

  it('should cancel class livestream signups that membership does not give access to', async () => {

    const classes = await Class.createEach([
      {
        client: testClientId,
        date: '2020-05-15',
        start_time: '12:00:00',
        end_time: '14:00:00',
        class_type: fixtures.classTypeDance.id,
      },
      {
        client: testClientId,
        date: '2020-05-15',
        start_time: '12:00:00',
        end_time: '14:00:00',
        class_type: fixtures.classTypeYoga.id,
      },
      {
        client: testClientId,
        date: '2020-05-16',
        start_time: '12:00:00',
        end_time: '14:00:00',
        class_type: fixtures.classTypeDance.id,
      },
      {
        client: testClientId,
        date: '2020-05-16',
        start_time: '12:00:00',
        end_time: '14:00:00',
        class_type: fixtures.classTypeYoga.id,
      },
    ]).fetch();

    await ClassLivestreamSignup.createEach([
      {
        client: testClientId,
        class: classes[0].id,
        user: fixtures.userAlice.id,
        used_membership: membership.id
      },
      {
        client: testClientId,
        class: classes[1].id,
        user: fixtures.userAlice.id,
        used_membership: membership.id
      },
      {
        client: testClientId,
        class: classes[2].id,
        user: fixtures.userAlice.id,
        used_membership: membership.id
      },
      {
        client: testClientId,
        class: classes[3].id,
        user: fixtures.userAlice.id,
        used_membership: membership.id
      },
    ])

    const timestampBeforeCall = Date.now() - 1;
    await sails.helpers.memberships.cancelFutureSignups.with({
      membership: membership,
      startDate: '2020-05-16',
      userGetsRefundAfterDeadline: true,
      onlyCancelSignupsWithoutAccess: true,
    });
    const timestampAfterCall = Date.now() + 1;

    let dbSignups = await ClassLivestreamSignup.find({});

    dbSignups = _.map(dbSignups, cs => _.pick(cs, ['class','user','used_membership', 'cancelled_at', 'archived']));

    expect(dbSignups).to.matchPattern(`[
      {
        class: ${classes[0].id},
        user: ${fixtures.userAlice.id},
        used_membership: ${membership.id},
        cancelled_at: 0,
        archived: false
      },
      {
        class: ${classes[1].id},
        user: ${fixtures.userAlice.id},
        used_membership: ${membership.id},
        cancelled_at: 0,
        archived: false
      },
      {
        class: ${classes[2].id},
        user: ${fixtures.userAlice.id},
        used_membership: ${membership.id},
        cancelled_at: _.isBetween|${timestampBeforeCall}|${timestampAfterCall},
        archived: false
      },
      {
        class: ${classes[3].id},
        user: ${fixtures.userAlice.id},
        used_membership: ${membership.id},
        cancelled_at: 0,
        archived: false
      },      
    ]`);

    await Class.destroy({});
    await ClassLivestreamSignup.destroy({});

  });


});
