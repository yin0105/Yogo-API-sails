const assert = require('assert');
const assertAsyncThrows = require('../../../utils/assert-async-throws');
const assertAsyncDbObject = require('../../../utils/assert-async-db-object');

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID;
const fixtures = require('../../../fixtures/factory').fixtures;

const sinon = require('sinon');
const emailSendFakeFactory = require('../../../fakes/email-send-fake-factory');

describe('create-livestream-signup', async function () {

  let classPassUnlimitedYogaUserAlice,
    classPassTenYogaClassesUserAlice,
    classPassTenYogaClassesUserBill,
    membershipYogaActive,
    membershipYogaActiveOtherRealUser,
    membershipYogaActiveUserBill,
    yogaClass1,
    yogaClass2,
    danceClass,
    signupWithMembership;

  before(async () => {
    // SET UP CLASS PASSES
    classPassUnlimitedYogaUserAlice = await ClassPass.create({
      class_pass_type: fixtures.classPassTypeYogaUnlimitedOneMonthLivestream.id, // One month unlimited yoga
      valid_until: '2018-05-20',
      client: testClientId,
      user: fixtures.userAlice.id,
    }).fetch();

    classPassTenYogaClassesUserAlice = await ClassPass.create({
      class_pass_type: fixtures.classPassTypeYogaTenClassesLivestream.id, // Yoga ten classes
      valid_until: '2018-05-20',
      classes_left: 8,
      client: testClientId,
      user: fixtures.userAlice.id,
    }).fetch();

    classPassTenYogaClassesUserBill = await ClassPass.create({
      class_pass_type: fixtures.classPassTypeYogaTenClassesLivestream.id, // Yoga ten classes
      valid_until: '2018-05-25',
      classes_left: 5,
      client: testClientId,
      user: fixtures.userBill.id,
    }).fetch();

    // SET UP MEMBERSHIPS
    membershipYogaActive = await Membership.create({
      membership_type: fixtures.membershipTypeYogaUnlimitedLivestream.id,
      paid_until: '2018-05-20',
      client: testClientId,
      status: 'active',
      user: fixtures.userAlice.id,
    }).fetch();

    membershipYogaActiveOtherRealUser = await Membership.create({
      membership_type: fixtures.membershipTypeYogaUnlimitedLivestream.id,
      paid_until: '2018-05-20',
      client: testClientId,
      status: 'active',
      user: fixtures.userAlice.id,
      real_user_is_someone_else: true,
      real_user_name: 'Dave',
    }).fetch();

    membershipYogaActiveUserBill = await Membership.create({
      membership_type: fixtures.membershipTypeYogaUnlimitedLivestream.id,
      paid_until: '2018-05-30',
      client: testClientId,
      status: 'active',
      user: fixtures.userBill.id,
    }).fetch();

    // SET UP CLASSES
    yogaClass1 = await Class.create({
      class_type: fixtures.classTypeYoga.id,
      date: '2018-05-15',
      start_time: '10:00:00',
      end_time: '12:00:00',
      client: testClientId,
      seats: 15,
    }).fetch();

    yogaClass2 = await Class.create({
      class_type: fixtures.classTypeYoga.id,
      date: '2018-05-15',
      start_time: '16:00:00',
      end_time: '18:00:00',
      client: testClientId,
      seats: 2,
    }).fetch();

    danceClass = await Class.create({
      date: '2018-05-15',
      start_time: '16:00:00',
      end_time: '18:00:00',
      class_type: fixtures.classTypeDance.id,
      client: testClientId,
      seats: 6,
    }).fetch();

    // SET UP SIGNUPS
    signupWithMembership = await ClassLivestreamSignup.create({
      'class': yogaClass1.id,
      user: fixtures.userAlice.id,
      used_membership: membershipYogaActive.id,
    }).fetch();
  });

  after(async () => {
    await ClassPass.destroy({id: [classPassUnlimitedYogaUserAlice.id, classPassTenYogaClassesUserAlice.id]});
    await Membership.destroy({id: [membershipYogaActive.id, membershipYogaActiveOtherRealUser.id, membershipYogaActiveUserBill.id]});
    await Class.destroy({id: [yogaClass1.id, yogaClass2.id, danceClass.id]});
    await ClassLivestreamSignup.destroy({id: signupWithMembership.id});
  });


  it('should throw "userNotFound" if user is not in the database. Test with ID input.', async () => {

    await assertAsyncThrows(
      async () => {
        await sails.helpers.classes.createLivestreamSignup.with({
          user: 9999999,
          classItem: yogaClass1,
        });
      },
      'userNotFound',
    );

  });

  it('should throw "userNotFound" if user is not in the database. Test with object input.', async () => {

    await assertAsyncThrows(
      async () => {
        await sails.helpers.classes.createLivestreamSignup.with({
          user: {
            id: 9999999,
          },
          classItem: yogaClass1,
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
        await sails.helpers.classes.createLivestreamSignup.with({
          user: archivedUser,
          classItem: yogaClass1,
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
        await sails.helpers.classes.createLivestreamSignup.with({
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
        await sails.helpers.classes.createLivestreamSignup.with({
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
        await sails.helpers.classes.createLivestreamSignup.with({
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

  it('should throw "alreadySignedUp" if customer is already signed up', async () => {

    await assertAsyncThrows(
      async () => {
        await sails.helpers.classes.createLivestreamSignup.with({
          user: fixtures.userAlice,
          classItem: yogaClass1,
        });
      },
      'alreadySignedUp',
    );

  });

  it('should throw "classIsFull" if livestream capacity limit is reached', async () => {

    const signup1 = await ClassLivestreamSignup.create({
      'class': yogaClass2.id,
      user: fixtures.userAlice.id,
      used_membership: membershipYogaActive.id,
    }).fetch();

    /*const signup2 = await ClassLivestreamSignup.create({
      'class': yogaClass2.id,
      user: fixtures.userAlice.id,
      used_membership: membershipYogaActiveOtherRealUser.id,
    }).fetch();*/

    const previousLivestreamCapacitySetting = sails.config.fmLiveswitch.maxConnectionsPerSession;
    sails.config.fmLiveswitch.maxConnectionsPerSession = 2;

    await assertAsyncThrows(
      async () => {
        return await sails.helpers.classes.createLivestreamSignup.with({
          user: fixtures.userBill,
          classItem: yogaClass2,
        });
      },
      'classIsFull',
    );

    sails.config.fmLiveswitch.maxConnectionsPerSession = previousLivestreamCapacitySetting;
    await ClassLivestreamSignup.destroy({id: signup1.id});

  });

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
        return await sails.helpers.classes.createLivestreamSignup.with({
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
    await ClassLivestreamSignup.destroy({})

    let newSignup = {};

    await assertAsyncDbObject(
      async () => {
        newSignup = await sails.helpers.classes.createLivestreamSignup.with({
          user: fixtures.userAlice,
          classItem: yogaClass2,
        });
        return newSignup;
      },
      {
        used_membership: membershipYogaActive.id,
      },
    );

    await ClassLivestreamSignup.destroy({id: newSignup.id});
  });


  it('should find and use a valid class pass if one is available. And decrease classes_left', async () => {

    const classPass = await ClassPass.create({
      user: fixtures.userDennis.id,
      class_pass_type: fixtures.classPassTypeYogaTenClassesLivestream.id,
      classes_left: 3,
      valid_until: '2018-05-20',
      client: testClientId,
    }).fetch();

    let newSignup = {};

    await assertAsyncDbObject(
      async () => {
        newSignup = await sails.helpers.classes.createLivestreamSignup.with({
          user: fixtures.userDennis,
          classItem: yogaClass1,
        });
        return newSignup;
      },
      {
        used_class_pass: classPass.id,
      },
    );

    const classPassAfterTest = await ClassPass.findOne(classPass.id);

    assert.equal(
      classPassAfterTest.classes_left,
      2,
    );

    await ClassPass.destroy({id: classPass.id});
    await ClassLivestreamSignup.destroy({id: newSignup.id});

  });


  it('should pick an unlimited class pass if there is both fixed_count and unlimited', async () => {

    const classPassTenClassesCharlie = await ClassPass.create({
      user: fixtures.userCharlie.id,
      class_pass_type: fixtures.classPassTypeYogaTenClassesLivestream.id,
      classes_left: 3,
      valid_until: '2018-05-20',
      client: testClientId,
    }).fetch();

    const classPassUnlimitedCharlie = await ClassPass.create({
      user: fixtures.userCharlie.id,
      class_pass_type: fixtures.classPassTypeYogaUnlimitedOneMonthLivestream.id,
      valid_until: '2018-05-20',
      client: testClientId,
    }).fetch();

    const newSignup = await sails.helpers.classes.createLivestreamSignup.with({
      user: fixtures.userCharlie,
      classItem: yogaClass1,
    });

    expect(newSignup).to.matchPattern(`{
      used_class_pass: ${classPassUnlimitedCharlie.id},
      ... 
    }`);

    await ClassLivestreamSignup.destroy({id: newSignup.id});
    await ClassPass.destroy({id: [classPassTenClassesCharlie.id, classPassUnlimitedCharlie.id]});

  });

  it('should use the fixed count class pass the expires first', async () => {

    const classPassTenClassesCharlie0 = await ClassPass.create({
      user: fixtures.userCharlie.id,
      class_pass_type: fixtures.classPassTypeYogaTenClassesLivestream.id,
      classes_left: 0,
      valid_until: '2018-05-20',
      client: testClientId,
    }).fetch();

    const classPassTenClassesCharlie1 = await ClassPass.create({
      user: fixtures.userCharlie.id,
      class_pass_type: fixtures.classPassTypeYogaTenClassesLivestream.id,
      classes_left: 10,
      valid_until: '2018-05-20',
      client: testClientId,
    }).fetch();

    const classPassTenClassesCharlie2 = await ClassPass.create({
      user: fixtures.userCharlie.id,
      class_pass_type: fixtures.classPassTypeYogaTenClassesLivestream.id,
      classes_left: 10,
      valid_until: '2018-05-15',
      client: testClientId,
    }).fetch();

    const classPassTenClassesCharlie3 = await ClassPass.create({
      user: fixtures.userCharlie.id,
      class_pass_type: fixtures.classPassTypeYogaTenClassesLivestream.id,
      classes_left: 10,
      valid_until: '2018-05-25',
      client: testClientId,
    }).fetch();

    const newSignup = await sails.helpers.classes.createLivestreamSignup.with({
      user: fixtures.userCharlie,
      classItem: yogaClass1,
    });

    expect(newSignup).to.matchPattern(`{
      used_class_pass: ${classPassTenClassesCharlie2.id},
      ... 
    }`);

    await ClassLivestreamSignup.destroy({id: newSignup.id});
    await ClassPass.destroy({
      id: [
        classPassTenClassesCharlie0.id,
        classPassTenClassesCharlie1.id,
        classPassTenClassesCharlie2.id,
        classPassTenClassesCharlie3.id,
      ],
    });

  });


  it('should throw "noAccess" if there are no valid memberships or class passes', async () => {

    await assertAsyncThrows(
      async () => {
        await sails.helpers.classes.createLivestreamSignup.with({
          user: fixtures.userBill,
          classItem: danceClass,
        });
      },
      'noAccess',
    );
  });

  it('should only create one signup on two simultaneous requests', async () => {

    const classPassDennis = await ClassPass.create({
      client: testClientId,
      user: fixtures.userDennis.id,
      class_pass_type: fixtures.classPassTypeYogaTenClassesLivestream.id,
      classes_left: 10,
      valid_until: '2018-05-20',
    }).fetch();

    let throwCount = 0;
    await Promise.all([
      sails.helpers.classes.createLivestreamSignup.with({
        user: fixtures.userDennis,
        classItem: yogaClass1,
      }).tolerate('noAccess', () => {
        throwCount += 1;
      }).tolerate('alreadySignedUp', () => {
        throwCount += 1;
      }),
      sails.helpers.classes.createLivestreamSignup.with({
        user: fixtures.userDennis,
        classItem: yogaClass1,
      }).tolerate('noAccess', () => {
        throwCount += 1;
      }).tolerate('alreadySignedUp', () => {
        throwCount += 1;
      }),
    ]);

    expect(throwCount).to.be.at.most(1);

    const createdSignups = await ClassLivestreamSignup.find({
      user: fixtures.userDennis.id,
      'class': yogaClass1.id,
    });

    expect(createdSignups.length).to.equal(1);

    const updatedClassPassDennis = await ClassPass.findOne(classPassDennis.id);
    expect(updatedClassPassDennis.classes_left).to.equal(9);

    await ClassLivestreamSignup.destroy({id: _.map(createdSignups, 'id')});
    await ClassPass.destroy({id: classPassDennis.id});

  });

  it('should only create one signup on three simultaneous requests', async () => {


    const classPassDennis = await ClassPass.create({
      client: testClientId,
      user: fixtures.userDennis.id,
      class_pass_type: fixtures.classPassTypeYogaTenClassesLivestream.id,
      classes_left: 10,
      valid_until: '2020-12-20',
    }).fetch();

    let noAccessCount = 0;


    await Promise.all([
      sails.helpers.classes.createLivestreamSignup.with({
        user: fixtures.userDennis,
        classItem: yogaClass1,
      }).tolerate('noAccess', () => {
        noAccessCount += 1;
      }),
      sails.helpers.classes.createLivestreamSignup.with({
        user: fixtures.userDennis,
        classItem: yogaClass1,
      }).tolerate('noAccess', () => {
        noAccessCount += 1;
      }),
      sails.helpers.classes.createLivestreamSignup.with({
        user: fixtures.userDennis,
        classItem: yogaClass1,
      }).tolerate('noAccess', () => {
        noAccessCount += 1;
      }),
    ]);


    expect(noAccessCount).to.be.at.most(2);

    const createdSignups = await ClassLivestreamSignup.find({
      user: fixtures.userDennis.id,
      class: yogaClass1.id,
    });

    expect(createdSignups.length).to.equal(1);

    const updatedClassPassDennis = await ClassPass.findOne(classPassDennis.id);
    expect(updatedClassPassDennis.classes_left).to.equal(9);

    await ClassLivestreamSignup.destroy({id: _.map(createdSignups, 'id')});
    await ClassPass.destroy({id: classPassDennis.id});

  });

  it('should only create one signup on two simultaneous requests if class pass has one class left', async () => {
    await ClassPass.destroy({})
    await ClassTypeEmail.destroy({})

    const classPassDennis = await ClassPass.create({
      client: testClientId,
      user: fixtures.userDennis.id,
      class_pass_type: fixtures.classPassTypeYogaTenClassesLivestream.id,
      classes_left: 1,
      valid_until: '2018-05-20',
    }).fetch();

    const classTypeEmail = await ClassTypeEmail.create({
      client_id: testClientId,
      class_types: [fixtures.classTypeYoga.id],
      subject: 'Class type email subject',
      body: 'Class type email body',
      send_at: 'signup',
      send_to_livestream_signups: true,
    }).fetch();

    const emailSendFake = emailSendFakeFactory.installEmailSendFake();

    let throwCount = 0;


    await Promise.all([
      sails.helpers.classes.createLivestreamSignup.with({
        user: fixtures.userDennis,
        classItem: yogaClass1,
      }).tolerate('noAccess', () => {
        throwCount += 1;
        return true;
      }),
      sails.helpers.classes.createLivestreamSignup.with({
        user: fixtures.userDennis,
        classItem: yogaClass2,
      }).tolerate('noAccess', () => {
        throwCount += 1;
        return true;
      }),
    ]);


    // Depending on the timing inside createLivestreamSignup, it may throw zero or one time(s)
    expect(throwCount).to.be.at.least(0);
    expect(throwCount).to.be.at.most(1);

    const createdSignupsForClass1 = await ClassLivestreamSignup.find({
      user: fixtures.userDennis.id,
      class: yogaClass1.id,
    });
    const createdSignupsForClass2 = await ClassLivestreamSignup.find({
      user: fixtures.userDennis.id,
      class: yogaClass2.id,
    });

    expect(createdSignupsForClass1.length + createdSignupsForClass2.length).to.equal(1);

    const updatedClassPassDennis = await ClassPass.findOne(classPassDennis.id);
    expect(updatedClassPassDennis.classes_left).to.equal(0);

    expect(emailSendFake.callCount).to.equal(1);
    expect(emailSendFake.getCall(0).args[0]).to.matchPattern(`{
      emailType: 'class_type_email',
      user: ${fixtures.userDennis.id},
      subject: 'Class type email subject',
      text: 'Class type email body',
      ...
    }`);

    await ClassLivestreamSignup.destroy({id: _.map(createdSignupsForClass1, 'id')});
    await ClassPass.destroy({id: classPassDennis.id});
    await ClassTypeEmail.destroy({id: classTypeEmail.id});

    sinon.restore();

  });

});
