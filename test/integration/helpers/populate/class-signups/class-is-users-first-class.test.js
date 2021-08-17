const testClientId = require('../../../../global-test-variables').TEST_CLIENT_ID;

const fixtures = require('../../../../fixtures/factory').fixtures;

describe('helpers.populate.class-signups.class-is-on-users-birthday', async function () {


  it('should populate class_is_users_first_class', async () => {

    const classes = await Class.createEach([
      {
        client: testClientId,
        class_type: fixtures.classTypeYoga.id,
        date: '2020-05-01',
        start_time: '16:00:00',
        end_time: '18:00:00',
      },
      {
        client: testClientId,
        class_type: fixtures.classTypeYoga.id,
        date: '2020-05-01',
        start_time: '10:00:00',
        end_time: '12:00:00',
      },
      {
        client: testClientId,
        class_type: fixtures.classTypeYoga.id,
        date: '2020-06-01',
        start_time: '08:00:00',
        end_time: '10:00:00',
      },
      {
        client: testClientId,
        class_type: fixtures.classTypeYoga.id,
        date: '2020-01-01',
        start_time: '08:00:00',
        end_time: '10:00:00',
      },
      {
        client: testClientId,
        class_type: fixtures.classTypeYoga.id,
        date: '2020-02-01',
        start_time: '08:00:00',
        end_time: '10:00:00',
        archived: true,
      },
    ]).fetch();

    const classSignups = await ClassSignup.createEach([
      {
        client: testClientId,
        class: classes[0].id,
        user: fixtures.userAlice.id,
      },
      {
        client: testClientId,
        class: classes[1].id,
        user: fixtures.userAlice.id,
      },
      {
        client: testClientId,
        class: classes[2].id,
        user: fixtures.userAlice.id,
      },
      {
        client: testClientId,
        class: classes[3].id,
        user: fixtures.userAlice.id,
        archived: true,
      },
      {
        client: testClientId,
        class: classes[4].id,
        user: fixtures.userAlice.id,
      },
    ]).fetch();

    await sails.helpers.populate.classSignups.classIsUsersFirstClass(classSignups);

    classSignups.sort((a, b) => {
      return a.user > b.user ? 1 : -1;
    });

    expect(classSignups).to.matchPattern(`[
      {
        client: ${testClientId},
        class: ${classes[0].id},
        user: ${fixtures.userAlice.id},
        class_is_users_first_class: false,
        ...
      },
      {
        client: ${testClientId},
        class: ${classes[1].id},
        user: ${fixtures.userAlice.id},
        class_is_users_first_class: true,
        ...
      },
      {
        client: ${testClientId},
        class: ${classes[2].id},
        user: ${fixtures.userAlice.id},
        class_is_users_first_class: false,
        ...
      },
      {
        client: ${testClientId},
        class: ${classes[3].id},
        user: ${fixtures.userAlice.id},
        class_is_users_first_class: false,
        ...
      },
      {
        client: ${testClientId},
        class: ${classes[4].id},
        user: ${fixtures.userAlice.id},
        class_is_users_first_class: false,
        ...
      }
    ]`);

    await ClassSignup.destroy({id: _.map(classSignups, 'id')});
    await Class.destroy({id: _.map(classes, 'id')});

  });

  it('should work with livestream signups', async () => {

    const classes = await Class.createEach([
      {
        client: testClientId,
        class_type: fixtures.classTypeYoga.id,
        date: '2020-05-01',
        start_time: '16:00:00',
        end_time: '18:00:00',
      },
      {
        client: testClientId,
        class_type: fixtures.classTypeYoga.id,
        date: '2020-05-02',
        start_time: '16:00:00',
        end_time: '18:00:00',
      },
      {
        client: testClientId,
        class_type: fixtures.classTypeYoga.id,
        date: '2020-05-03',
        start_time: '16:00:00',
        end_time: '18:00:00',
      },
    ]).fetch();

    const classSignups = await ClassSignup.createEach([
      {
        client: testClientId,
        class: classes[1].id,
        user: fixtures.userAlice.id,
      },
    ]).fetch();

    const classLivestreamSignups = await ClassLivestreamSignup.createEach([
      {
        client: testClientId,
        class: classes[0].id,
        user: fixtures.userAlice.id,
      },
    ]).fetch();

    await sails.helpers.populate.classSignups.classIsUsersFirstClass([...classSignups, ...classLivestreamSignups]);

    expect(classSignups).to.matchPattern(`[
      {
        client: ${testClientId},
        class: ${classes[1].id},
        user: ${fixtures.userAlice.id},
        class_is_users_first_class: false,
        ...
      }     
    ]`);

    expect(classLivestreamSignups).to.matchPattern(`[
      {
        client: ${testClientId},
        class: ${classes[0].id},
        user: ${fixtures.userAlice.id},
        class_is_users_first_class: true,
        ...
      }     
    ]`);

    await ClassSignup.destroy({id: _.map(classSignups, 'id')});
    await ClassLivestreamSignup.destroy({id: _.map(classLivestreamSignups, 'id')});
    await Class.destroy({id: _.map(classes, 'id')});

  });

  it('should populate waitlist signups as well', async () => {

    const classes = await Class.createEach([
      {
        client: testClientId,
        class_type: fixtures.classTypeYoga.id,
        date: '2020-05-01',
        start_time: '16:00:00',
        end_time: '18:00:00',
      },
      {
        client: testClientId,
        class_type: fixtures.classTypeYoga.id,
        date: '2020-05-02',
        start_time: '16:00:00',
        end_time: '18:00:00',
      },
      {
        client: testClientId,
        class_type: fixtures.classTypeYoga.id,
        date: '2020-05-03',
        start_time: '16:00:00',
        end_time: '18:00:00',
      },
    ]).fetch();

    const classWaitingListSignups = await ClassWaitingListSignup.createEach([
      {
        client: testClientId,
        class: classes[0].id,
        user: fixtures.userAlice.id,
      },
      {
        client: testClientId,
        class: classes[1].id,
        user: fixtures.userAlice.id,
      },
    ]).fetch();

    const classLivestreamSignups = await ClassLivestreamSignup.createEach([
      {
        client: testClientId,
        class: classes[0].id,
        user: fixtures.userAlice.id,
        archived: true
      },
      {
        client: testClientId,
        class: classes[1].id,
        user: fixtures.userAlice.id,
      },
      {
        client: testClientId,
        class: classes[2].id,
        user: fixtures.userAlice.id,
      },
    ]).fetch();

    await sails.helpers.populate.classSignups.classIsUsersFirstClass([...classWaitingListSignups, ...classLivestreamSignups]);

    expect(classWaitingListSignups).to.matchPattern(`[
      {
        client: ${testClientId},
        class: ${classes[0].id},
        user: ${fixtures.userAlice.id},
        class_is_users_first_class: false,
        ...
      },
      {
        client: ${testClientId},
        class: ${classes[1].id},
        user: ${fixtures.userAlice.id},
        class_is_users_first_class: true,
        ...
      }
    ]`);

    expect(classLivestreamSignups).to.matchPattern(`[
      {
        client: ${testClientId},
        class: ${classes[0].id},
        user: ${fixtures.userAlice.id},
        archived: true,
        class_is_users_first_class: false,
        ...
      },
      {
        client: ${testClientId},
        class: ${classes[1].id},
        user: ${fixtures.userAlice.id},
        class_is_users_first_class: true,
        ...
      },
      {
        client: ${testClientId},
        class: ${classes[2].id},
        user: ${fixtures.userAlice.id},
        class_is_users_first_class: false,
        ...
      }     
    ]`);

    await ClassWaitingListSignup.destroy({id: _.map(classWaitingListSignups, 'id')});
    await ClassLivestreamSignup.destroy({id: _.map(classLivestreamSignups, 'id')});
    await Class.destroy({id: _.map(classes, 'id')});

  });


});
