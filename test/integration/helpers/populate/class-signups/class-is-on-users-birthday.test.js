const testClientId = require('../../../../global-test-variables').TEST_CLIENT_ID;
const assert = require('assert');

const fixtures = require('../../../../fixtures/factory').fixtures;

describe('helpers.populate.class-signups.class-is-on-users-birthday', async function () {

  it('should return an empty array if input is empty', async () => {

    const result = await sails.helpers.populate.classSignups.classIsOnUsersBirthday([]);

    assert(_.isArray(result) && result.length === 0);

  });


  it('should return input array unchanged if input is already populated', async () => {

    const classes = [{
      class_is_on_users_birthday: true,
    }];

    await sails.helpers.populate.classSignups.classIsOnUsersBirthday(classes);

    assert.deepStrictEqual(
      classes,
      [{
        class_is_on_users_birthday: true,
      }],
    );

  });

  it('should populate class_is_on_users_birthday', async () => {

    const classes = await Class.createEach([
      {
        client: testClientId,
        class_type: fixtures.classTypeYoga.id,
        date: '2020-05-03',
        start_time: '23:59:59',
        end_time: '01:00:00',
      },
      {
        client: testClientId,
        class_type: fixtures.classTypeYoga.id,
        date: '2020-05-03',
        start_time: '00:00:00',
        end_time: '02:00:00',
      },
      {
        client: testClientId,
        class_type: fixtures.classTypeYoga.id,
        date: '2020-05-02',
        start_time: '23:59:59',
        end_time: '01:00:00',
      },
      {
        client: testClientId,
        class_type: fixtures.classTypeYoga.id,
        date: '2020-05-04',
        start_time: '00:00:00',
        end_time: '02:00:00',
      },
    ]).fetch();

    const classSignups = await Promise.all(_.map(
      classes,
      cls => ClassSignup.create(
        {
          client: testClientId,
          class: cls.id,
          user: fixtures.userAlice.id,
        },
      ).fetch(),
    ));

    const existingDateOfBirth = fixtures.userAlice.date_of_birth;
    await User.update({id: fixtures.userAlice.id}, {date_of_birth: '1953-05-03'});

    await sails.helpers.populate.classSignups.classIsOnUsersBirthday(classSignups);

    expect(classSignups).to.matchPattern(`[
      {
        client: ${testClientId},
        class: {id: ${classes[0].id}, ...},
        user: {id: ${fixtures.userAlice.id}, ...},
        class_is_on_users_birthday: true,
        ...
      },
      {
        client: ${testClientId},
        class: {id: ${classes[1].id}, ...},
        user: {id: ${fixtures.userAlice.id}, ...},
        class_is_on_users_birthday: true,
        ...
      },
      {
        client: ${testClientId},
        class: {id: ${classes[2].id}, ...},
        user: {id: ${fixtures.userAlice.id}, ...},
        class_is_on_users_birthday: false,
        ...
      },
      {
        client: ${testClientId},
        class: {id: ${classes[3].id}, ...},
        user: {id: ${fixtures.userAlice.id}, ...},
        class_is_on_users_birthday: false,
        ...
      },     
    ]`);

    await User.update({id: fixtures.userAlice.id}, {date_of_birth: existingDateOfBirth});
    await ClassSignup.destroy({id: _.map(classSignups, 'id')});
    await Class.destroy({id: _.map(classes, 'id')});

  });

  it('should return false if user.date_of_birth is null', async () => {

    const classObj = await Class.create({
      client: testClientId,
      class_type: fixtures.classTypeYoga.id,
      date: '2020-05-03',
      start_time: '20:00:00',
      end_time: '22:00:00',
    }).fetch();

    const classSignup = await ClassSignup.create({
      client: testClientId,
      class: classObj.id,
      user: fixtures.userAlice.id,
    }).fetch();

    const existingDateOfBirth = fixtures.userAlice.date_of_birth;

    await User.update({id: fixtures.userAlice.id}, {date_of_birth: null});
    await sails.helpers.populate.classSignups.classIsOnUsersBirthday([classSignup]);

    expect(classSignup).to.matchPattern(`{
      client: ${testClientId},
      class: {id: ${classObj.id}, ...},
      user: {id: ${fixtures.userAlice.id}, ...},
      class_is_on_users_birthday: false,
      ...
    }`);

    await User.update({id: fixtures.userAlice.id}, {date_of_birth: existingDateOfBirth});
    await ClassSignup.destroy({id: classSignup.id});
    await Class.destroy({id: classObj.id});
  })


  /*it('should return false if user.date_of_birth is 0000-00-00', async () => {

    const classObj = await Class.create({
      client: testClientId,
      class_type: fixtures.classTypeYoga.id,
      date: '2020-05-03',
      start_time: '20:00:00',
      end_time: '22:00:00',
    }).fetch();

    const classSignup = await ClassSignup.create({
      client: testClientId,
      class: classObj.id,
      user: fixtures.userAlice.id,
    }).fetch();

    const existingDateOfBirth = fixtures.userAlice.date_of_birth;

    await User.update({id: fixtures.userAlice.id}, {date_of_birth: '0000-00-00'});
    await sails.helpers.populate.classSignups.classIsOnUsersBirthday([classSignup]);

    expect(classSignup).to.matchPattern(`{
      client: ${testClientId},
      class: {id: ${classObj.id}, ...},
      user: {id: ${fixtures.userAlice.id}, ...},
      class_is_on_users_birthday: false,
      ...
    }`);

    await User.update({id: fixtures.userAlice.id}, {date_of_birth: existingDateOfBirth});
    await ClassSignup.destroy({id: classSignup.id});
    await Class.destroy({id: classObj.id});
  })*/

  it('should return true if user.date_of_birth year is before 1900', async () => {

    const classObj = await Class.create({
      client: testClientId,
      class_type: fixtures.classTypeYoga.id,
      date: '2020-05-03',
      start_time: '20:00:00',
      end_time: '22:00:00',
    }).fetch();

    const classSignup = await ClassSignup.create({
      client: testClientId,
      class: classObj.id,
      user: fixtures.userAlice.id,
    }).fetch();

    const existingDateOfBirth = fixtures.userAlice.date_of_birth;


    await User.update({id: fixtures.userAlice.id}, {date_of_birth: '1899-05-03'}); // Invalid date
    await sails.helpers.populate.classSignups.classIsOnUsersBirthday([classSignup]);

    expect(classSignup).to.matchPattern(`{
      client: ${testClientId},
      class: {id: ${classObj.id}, ...},
      user: {id: ${fixtures.userAlice.id}, ...},
      class_is_on_users_birthday: false,
      ...
    }`);
    delete classSignup.class_is_on_users_birthday;

    await User.update({id: fixtures.userAlice.id}, {date_of_birth: existingDateOfBirth});
    await ClassSignup.destroy({id: classSignup.id});
    await Class.destroy({id: classObj.id});

  });

  it('should return true if user.date_of_birth is 1900 or more', async () => {

    const classObj = await Class.create({
      client: testClientId,
      class_type: fixtures.classTypeYoga.id,
      date: '2020-05-03',
      start_time: '20:00:00',
      end_time: '22:00:00',
    }).fetch();

    const classSignup = await ClassSignup.create({
      client: testClientId,
      class: classObj.id,
      user: fixtures.userAlice.id,
    }).fetch();

    const existingDateOfBirth = fixtures.userAlice.date_of_birth;


    await User.update({id: fixtures.userAlice.id}, {date_of_birth: '1900-05-03'}); // Invalid date
    await sails.helpers.populate.classSignups.classIsOnUsersBirthday([classSignup]);

    expect(classSignup).to.matchPattern(`{
      client: ${testClientId},
      class: {id: ${classObj.id}, ...},
      user: {id: ${fixtures.userAlice.id}, ...},
      class_is_on_users_birthday: true,
      ...
    }`);
    delete classSignup.class_is_on_users_birthday;

    await User.update({id: fixtures.userAlice.id}, {date_of_birth: existingDateOfBirth});
    await ClassSignup.destroy({id: classSignup.id});
    await Class.destroy({id: classObj.id});

  });


});


