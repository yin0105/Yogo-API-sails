const assert = require('assert');
const assertAsyncThrows = require('../../../utils/assert-async-throws');

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID;
const fixtures = require('../../../fixtures/factory').fixtures;

describe('create-waiting-list-signup', async function () {

  let
    classPassUnlimitedAlice,
    classPassTenClassesAlice,
    membershipAlice,
    membershipBill,
    membershipCharlie,
    class1,
    class2,
    classSignup,
    class2Signup;

  before(async () => {
    // SET UP CLASS PASSES
    classPassUnlimitedAlice = await ClassPass.create({
      class_pass_type: fixtures.classPassTypeYogaUnlimitedOneMonth.id, // One month unlimited yoga
      valid_until: '2018-05-20',
      client: testClientId,
      user: fixtures.userAlice.id,
    }).fetch();

    classPassTenClassesAlice = await ClassPass.create({
      class_pass_type: fixtures.classPassTypeYogaTenClasses.id, // Yoga ten classes
      valid_until: '2018-05-20',
      classes_left: 8,
      client: testClientId,
      user: fixtures.userAlice.id,
    }).fetch();

    membershipAlice = await Membership.create({
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      paid_until: '2018-05-20',
      client: testClientId,
      status: 'active',
      user: fixtures.userAlice.id,
    }).fetch();

    membershipBill = await Membership.create({
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      paid_until: '2018-05-30',
      client: testClientId,
      status: 'active',
      user: fixtures.userBill.id,
    }).fetch();

    membershipCharlie = await Membership.create({
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      paid_until: '2018-05-30',
      client: testClientId,
      status: 'active',
      user: fixtures.userCharlie.id,
    }).fetch();

    class1 = await Class.create({
      class_type: fixtures.classTypeYoga.id,
      date: '2018-05-15',
      start_time: '10:00:00',
      end_time: '12:00:00',
      client: testClientId,
      seats: 1,
    }).fetch();

    class2 = await Class.create({
      class_type: fixtures.classTypeYoga.id,
      date: '2018-05-15',
      start_time: '12:00:00',
      end_time: '14:00:00',
      client: testClientId,
      seats: 1,
    }).fetch();

    // SET UP SIGNUPS
    classSignup = await ClassSignup.create({
      'class': class1.id,
      user: fixtures.userBill.id,
      used_membership: membershipBill.id,
    }).fetch();

    class2Signup = await ClassSignup.create({
      'class': class2.id,
      user: fixtures.userBill.id,
      used_membership: membershipBill.id,
    }).fetch();

  });

  after(async () => {
    await ClassPass.destroy({id: [classPassUnlimitedAlice.id, classPassTenClassesAlice.id]});
    await Membership.destroy({id: [membershipAlice.id, membershipBill.id]});
    await Class.destroy({id: [class1.id, class2.id]});
    await ClassSignup.destroy({id: [classSignup.id, class2Signup.id]});
  });


  it('should throw "userNotFound" if user is not in the database. Test with ID input.', async () => {

    await assertAsyncThrows(
      async () => {
        await sails.helpers.classes.createWaitingListSignup.with({
          user: 9999999,
          classItem: class1,
        });
      },
      'userNotFound',
    );

  });

  it('should throw "userNotFound" if user is not in the database. Test with object input.', async () => {

    await assertAsyncThrows(
      async () => {
        await sails.helpers.classes.createWaitingListSignup.with({
          user: {
            id: 9999999,
          },
          classItem: class1,
        });
      },
      'userNotFound',
    );

  });

  it('should throw "userNotFound" if user is not in the database. Test with archived user.', async () => {

    const archivedUser = await User.create({
      archived: true,
      email: 'tester@example.com',
    }).fetch();

    await assertAsyncThrows(
      async () => {
        await sails.helpers.classes.createWaitingListSignup.with({
          user: archivedUser,
          classItem: class1,
        });
      },
      'userNotFound',
    );

    await User.destroy({
      id: archivedUser.id,
    });

  });

  it('should throw "classNotFound" if class is not in the database. Test with ID input.', async () => {

    await assertAsyncThrows(
      async () => {
        await sails.helpers.classes.createWaitingListSignup.with({
          user: fixtures.userAlice,
          classItem: 9999999,
        });
      },
      'classNotFound',
    );

  });


  it('should throw "classNotFound" if class is not in the database. Test with object input.', async () => {

    await assertAsyncThrows(
      async () => {
        await sails.helpers.classes.createWaitingListSignup.with({
          user: fixtures.userAlice,
          classItem: {
            id: 9999999,
          },
        });
      },
      'classNotFound',
    );

  });

  it('should throw "classNotFound" if class is not in the database. Test with archived class.', async () => {

    const archivedClass = await Class.create({
      archived: true,
    }).fetch();

    await assertAsyncThrows(
      async () => {
        await sails.helpers.classes.createWaitingListSignup.with({
          user: fixtures.userAlice,
          classItem: archivedClass,
        });
      },
      'classNotFound',
    );

    await Class.destroy({
      id: archivedClass.id,
    });

  });

  it('should throw "classIsNotFull" if class is not full', async () => {

    await Class.update({id: class1.id}, {seats: 2});

    await assertAsyncThrows(
      async () => {
        await sails.helpers.classes.createWaitingListSignup.with({
          user: fixtures.userAlice,
          classItem: class1,
        });
      },
      'classIsNotFull',
    );

    await Class.update({id: class1.id}, {seats: 1});

  });

  it('should throw "alreadySignedUp" if customer is already signed up for class', async () => {

    await assertAsyncThrows(
      async () => {
        await sails.helpers.classes.createWaitingListSignup.with({
          user: fixtures.userBill,
          classItem: class1,
        });
      },
      'alreadySignedUp',
    );

  });

  it('should throw "alreadySignedUpForWaitingList" if customer is already signed up for waiting list', async () => {

    const waitingListSignup = await ClassWaitingListSignup.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      class: class1.id,
    }).fetch();

    await assertAsyncThrows(
      async () => {
        await sails.helpers.classes.createWaitingListSignup.with({
          user: fixtures.userAlice,
          classItem: class1,
        });
      },
      'alreadySignedUpForWaitingList',
    );

    await ClassWaitingListSignup.destroy({id: waitingListSignup.id});

  });

  it('should throw "waitingListIsFull" if there are no available seats on the waiting list', async () => {

    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'private_class_waiting_list_max_customers_on_waiting_list',
      value: 1,
    }).fetch();

    const waitingListSignup = await ClassWaitingListSignup.create({
      client: testClientId,
      'class': class1.id,
      user: fixtures.userAlice.id,
      used_membership: membershipAlice.id,
    }).fetch();

    await assertAsyncThrows(
      async () => {
        return await sails.helpers.classes.createWaitingListSignup.with({
          user: fixtures.userCharlie,
          classItem: class1,
        });
      },
      'waitingListIsFull',
    );

    await ClassWaitingListSignup.destroy({id: [waitingListSignup.id]});

    await ClientSettings.destroy({id: clientSettingsRow.id});

  });

  /*it('should allow overbooking if overbooking parameter is true', async () => {

    const signup1 = await ClassWaitingListSignup.create({
      'class': yogaClass2.id,
      user: fixtures.userAlice.id,
      used_membership: membershipAlice.id,
    }).fetch();

    const signup2 = await ClassWaitingListSignup.create({
      'class': yogaClass2.id,
      user: fixtures.userAlice.id,
      used_membership: membershipYogaActiveOtherRealUser.id,
    }).fetch();

    const newSignup = await sails.helpers.classes.createWaitingListSignup.with({
      user: fixtures.userBill,
      classItem: yogaClass2,
      useMembership: membershipBill,
      allowOverbooking: true,
    });

    expect(newSignup).to.matchPattern(`{
      'class': ${yogaClass2.id},
      user: ${fixtures.userBill.id},
      ...
    }`);

    await ClassWaitingListSignup.destroy({id: [signup1.id, signup2.id, newSignup.id]});

  });*/

  it('should throw "classCancelled" if the class is cancelled', async () => {

    const cancelledClass = await Class.create({
      date: '2018-05-15',
      class_type: fixtures.classTypeYoga.id,
      client: testClientId,
      seats: 4,
      cancelled: true,
    }).fetch();

    await assertAsyncThrows(
      async () => {
        return await sails.helpers.classes.createWaitingListSignup.with({
          user: fixtures.userAlice,
          classItem: cancelledClass,
        });
      },
      'classCancelled',
    );

    await Class.destroy({id: cancelledClass.id});

  });

  // No need to test all variants of which membership is selected here. There are separate tests for "getValidMembershipsForClass" and "getValidClassPassesForClass".
  it('should find and use a valid membership if one is available.', async () => {

    const newSignup = await sails.helpers.classes.createWaitingListSignup.with({
      user: fixtures.userAlice,
      classItem: class1,
    });

    expect(newSignup).to.matchPattern(`{
      used_membership: ${membershipAlice.id},
      ...
    }`);

    await ClassWaitingListSignup.destroy({id: newSignup.id});
  });


  it('should find and use a valid class pass if one is available. And decrease classes_left', async () => {

    const classPassTenClassesDennis = await ClassPass.create({
      user: fixtures.userDennis.id,
      class_pass_type: fixtures.classPassTypeYogaTenClasses.id,
      classes_left: 3,
      valid_until: '2018-05-20',
      client: testClientId,
    }).fetch();

    const newSignup = await sails.helpers.classes.createWaitingListSignup.with({
      user: fixtures.userDennis,
      classItem: class1,
    });

    expect(newSignup).to.matchPattern(`{
        used_class_pass: ${classPassTenClassesDennis.id},
        ...
      }`,
    );

    const classPassAfterTest = await ClassPass.findOne(classPassTenClassesDennis.id);

    assert.equal(
      classPassAfterTest.classes_left,
      2,
    );

    await ClassPass.destroy({id: classPassTenClassesDennis.id});
    await ClassWaitingListSignup.destroy({id: newSignup.id});

  });


  it('should pick an unlimited class pass if there is both fixed_count and unlimited', async () => {

    const classPassTenClassesDennis = await ClassPass.create({
      user: fixtures.userDennis.id,
      class_pass_type: fixtures.classPassTypeYogaTenClasses.id,
      classes_left: 3,
      valid_until: '2018-05-20',
      client: testClientId,
    }).fetch();

    const classPassUnlimitedDennis = await ClassPass.create({
      user: fixtures.userDennis.id,
      class_pass_type: fixtures.classPassTypeYogaUnlimitedOneMonth.id,
      valid_until: '2018-05-20',
      client: testClientId,
    }).fetch();

    const newSignup = await sails.helpers.classes.createWaitingListSignup.with({
      user: fixtures.userDennis,
      classItem: class1,
    });

    expect(newSignup).to.matchPattern(`{
        used_class_pass: ${classPassUnlimitedDennis.id},
        ...
      }`);

    await ClassPass.destroy({id: [classPassTenClassesDennis.id, classPassUnlimitedDennis.id]});
    await ClassWaitingListSignup.destroy({id: newSignup.id});

  });

  it('should use the fixed count class pass that expires first', async () => {

    const classPassTenClassesDennis0 = await ClassPass.create({
      user: fixtures.userDennis.id,
      class_pass_type: fixtures.classPassTypeYogaTenClasses.id,
      classes_left: 0,
      valid_until: '2018-05-10',
      client: testClientId,
    }).fetch();

    const classPassTenClassesDennis1 = await ClassPass.create({
      user: fixtures.userDennis.id,
      class_pass_type: fixtures.classPassTypeYogaTenClasses.id,
      classes_left: 3,
      valid_until: '2018-05-20',
      client: testClientId,
    }).fetch();

    const classPassTenClassesDennis2 = await ClassPass.create({
      user: fixtures.userDennis.id,
      class_pass_type: fixtures.classPassTypeYogaTenClasses.id,
      classes_left: 3,
      valid_until: '2018-05-15',
      client: testClientId,
    }).fetch();

    const classPassTenClassesDennis3 = await ClassPass.create({
      user: fixtures.userDennis.id,
      class_pass_type: fixtures.classPassTypeYogaTenClasses.id,
      classes_left: 3,
      valid_until: '2018-05-25',
      client: testClientId,
    }).fetch();

    const newSignup = await sails.helpers.classes.createWaitingListSignup.with({
      user: fixtures.userDennis,
      classItem: class1,
    });

    expect(newSignup).to.matchPattern(`{
        used_class_pass: ${classPassTenClassesDennis2.id},
        ...
      }`);

    await ClassPass.destroy({
      id: [
        classPassTenClassesDennis0.id,
        classPassTenClassesDennis1.id,
        classPassTenClassesDennis2.id,
        classPassTenClassesDennis3.id,
      ],
    });
    await ClassWaitingListSignup.destroy({id: newSignup.id});

  });

  it('should throw "noAccess" if there are no valid memberships or class passes', async () => {

    await assertAsyncThrows(
      async () => {
        await sails.helpers.classes.createWaitingListSignup.with({
          user: fixtures.userEvelyn,
          classItem: class1,
        });
      },
      'noAccess',
    );
  });

  it('should only create one signup on two simultaneous requests', async () => {

    const classPassDennis = await ClassPass.create({
      client: testClientId,
      user: fixtures.userDennis.id,
      class_pass_type: fixtures.classPassTypeYogaTenClasses.id,
      classes_left: 10,
      valid_until: '2018-05-20',
    }).fetch();

    await Promise.all([
      sails.helpers.classes.createWaitingListSignup.with({
        user: fixtures.userDennis,
        classItem: class1,
      }),
      sails.helpers.classes.createWaitingListSignup.with({
        user: fixtures.userDennis,
        classItem: class1,
      }),
    ]);

    const createdSignups = await ClassWaitingListSignup.find({
      user: fixtures.userDennis.id,
      'class': class1.id,
    });

    expect(createdSignups.length).to.equal(1);

    const updatedClassPassDennis = await ClassPass.findOne(classPassDennis.id);
    expect(updatedClassPassDennis.classes_left).to.equal(9);

    await ClassWaitingListSignup.destroy({id: _.map(createdSignups, 'id')});
    await ClassPass.destroy({id: classPassDennis.id});

  });

  it('should only create one signup on three simultaneous requests', async () => {


    const classPassDennis = await ClassPass.create({
      client: testClientId,
      user: fixtures.userDennis.id,
      class_pass_type: fixtures.classPassTypeYogaTenClasses.id,
      classes_left: 10,
      valid_until: '2018-05-20',
    }).fetch();

    await Promise.all([
      sails.helpers.classes.createWaitingListSignup.with({
        user: fixtures.userDennis,
        classItem: class1,
      }),
      sails.helpers.classes.createWaitingListSignup.with({
        user: fixtures.userDennis,
        classItem: class1,
      }),
      sails.helpers.classes.createWaitingListSignup.with({
        user: fixtures.userDennis,
        classItem: class1,
      }),
    ]);

    const createdSignups = await ClassWaitingListSignup.find({
      user: fixtures.userDennis.id,
      class: class1.id,
    });

    expect(createdSignups.length).to.equal(1);

    const updatedClassPassDennis = await ClassPass.findOne(classPassDennis.id);
    expect(updatedClassPassDennis.classes_left).to.equal(9);

    await ClassWaitingListSignup.destroy({id: _.map(createdSignups, 'id')});
    await ClassPass.destroy({id: classPassDennis.id});

  });

  it('should only create one signup on two simultaneous requests if class pass has one class left', async () => {

    const classPassDennis = await ClassPass.create({
      client: testClientId,
      user: fixtures.userDennis.id,
      class_pass_type: fixtures.classPassTypeYogaTenClasses.id,
      classes_left: 1,
      valid_until: '2018-05-20',
    }).fetch();

    let throwCount = 0;


    await Promise.all([
      sails.helpers.classes.createWaitingListSignup.with({
        user: fixtures.userDennis,
        classItem: class1,
      }).tolerate('noAccess', () => {
        throwCount += 1;
      }),
      sails.helpers.classes.createWaitingListSignup.with({
        user: fixtures.userDennis,
        classItem: class2,
      }).tolerate('noAccess', () => {
        throwCount += 1;
      }),
    ]);


    // Depending on the timing inside createWaitingListSignup, it may throw zero or one time(s)
    expect(throwCount).to.be.at.most(1);

    const createdSignupsForClass1 = await ClassWaitingListSignup.find({
      user: fixtures.userDennis.id,
      class: class1.id,
    });
    const createdSignupsForClass2 = await ClassWaitingListSignup.find({
      user: fixtures.userDennis.id,
      class: class2.id,
    });

    expect(createdSignupsForClass1.length + createdSignupsForClass2.length).to.equal(1);

    const updatedClassPassDennis = await ClassPass.findOne(classPassDennis.id);
    expect(updatedClassPassDennis.classes_left).to.equal(0);

    await ClassWaitingListSignup.destroy({id: _.map(createdSignupsForClass1, 'id')});
    await ClassPass.destroy({id: classPassDennis.id});

  });

});
