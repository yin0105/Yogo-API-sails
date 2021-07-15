const assert = require('assert');

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID;
const fixtures = require('../../../fixtures/factory').fixtures;

const supertest = require('supertest');

const comparePartialObject = require('../../../utils/compare-partial-object');

const {authorizeUserAlice, authorizeAdmin} = require('../../../utils/request-helpers');

const sinon = require('sinon');

describe('controllers.Classes.cancel', async function () {

  let
    smsSendFake,
    emailSendFake;

  before(async () => {
    smsSendFake = sinon.fake();
    smsSendFake.with = smsSendFake;
    sinon.replace(sails.helpers.sms, 'send', smsSendFake);

    emailSendFake = sinon.fake();
    emailSendFake.with = emailSendFake;
    sinon.replace(sails.helpers.email, 'send', emailSendFake);

  });

  afterEach(async () => {
    smsSendFake.resetHistory();
    emailSendFake.resetHistory();
  });

  after(async () => {
    sinon.restore();
    await ClassPassLog.destroy({});
  });

  it('should throw forbidden if user is not admin', async () => {

    const class1 = await Class.create({
      client: testClientId,
      class_type: fixtures.classTypeYoga.id,
      date: '2019-05-15',
      start_time: '12:00:00',
      end_time: '14:00:00',
    }).fetch();

    await supertest(sails.hooks.http.app)
      .put('/classes/' + class1.id + '/cancel?client=' + testClientId)
      .expect(403);

    await supertest(sails.hooks.http.app)
      .put('/classes/' + class1.id + '/cancel?client=' + testClientId)
      .use(authorizeUserAlice())
      .expect(403);

    await Class.destroy({id: class1.id});
  });

  it('should return forbidden if class does not exist', async () => {

    await supertest(sails.hooks.http.app)
      .put('/classes/1/cancel?client=' + testClientId)
      .use(authorizeAdmin())
      .expect(403);

  });

  it('should fail if class is archived', async () => {

    const archivedClass = await Class.create({
      client: testClientId,
      class_type: fixtures.classTypeYoga.id,
      date: '2019-05-15',
      start_time: '12:00:00',
      end_time: '14:00:00',
      archived: true,
    }).fetch();

    await supertest(sails.hooks.http.app)
      .put('/classes/' + archivedClass.id + '/cancel?client=' + testClientId)
      .use(authorizeAdmin())
      .expect(400)
      .expect('"Class has been deleted"');

    await Class.destroy({id: archivedClass.id});

  });

  it('should fail if class is already cancelled', async () => {

    const archivedClass = await Class.create({
      client: testClientId,
      class_type: fixtures.classTypeYoga.id,
      date: '2019-05-15',
      start_time: '12:00:00',
      end_time: '14:00:00',
      cancelled: true,
    }).fetch();

    await supertest(sails.hooks.http.app)
      .put('/classes/' + archivedClass.id + '/cancel?client=' + testClientId)
      .use(authorizeAdmin())
      .expect(400)
      .expect('"Class is already cancelled"');

    await Class.destroy({id: archivedClass.id});

  });

  it('should succeed if class has no signups', async () => {

    const class1 = await Class.create({
      client: testClientId,
      class_type: fixtures.classTypeYoga.id,
      date: '2019-05-15',
      start_time: '12:00:00',
      end_time: '14:00:00',
    }).fetch();

    await supertest(sails.hooks.http.app)
      .put('/classes/' + class1.id + '/cancel?client=' + testClientId)
      .use(authorizeAdmin())
      .expect(200);

    const cancelledClass = await Class.findOne(class1.id);
    assert(cancelledClass.cancelled === true);

    assert.strictEqual(
      smsSendFake.callCount,
      0,
    );

    assert.strictEqual(
      emailSendFake.callCount,
      0,
    );

    await Class.destroy({id: class1.id});

  });

  it('should succeed if class has signups', async () => {

    const class1 = await Class.create({
      client: testClientId,
      class_type: fixtures.classTypeYoga.id,
      date: '2019-05-15',
      start_time: '12:00:00',
      end_time: '14:00:00',
    }).fetch();

    const membershipAlice = await Membership.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'active',
      paid_until: '2019-06-15',
    }).fetch();

    const classPassBill = await ClassPass.create({
      client: testClientId,
      user: fixtures.userBill.id,
      class_pass_type: fixtures.classPassTypeYogaTenClasses.id,
      classes_left: 7,
    }).fetch();

    const signup1 = await ClassSignup.create({
      'class': class1.id,
      user: fixtures.userAlice.id,
      used_membership: membershipAlice.id,
      client: testClientId,
    }).fetch();

    const signup2 = await ClassSignup.create({
      'class': class1.id,
      user: fixtures.userBill.id,
      used_class_pass: classPassBill.id,
      client: testClientId,
    }).fetch();

    await supertest(sails.hooks.http.app)
      .put('/classes/' + class1.id + '/cancel?client=' + testClientId)
      .use(authorizeAdmin())
      .expect(200);

    const cancelledClass = await Class.findOne(class1.id);
    assert(cancelledClass.cancelled === true);

    const signups = await Promise.all([
      ClassSignup.findOne(signup1.id),
      ClassSignup.findOne(signup2.id),
    ]);

    comparePartialObject(
      signups,
      [
        {
          archived: false,
          cancelled_at: 0,
        },
        {
          archived: false,
          cancelled_at: 0,
        },
      ],
    );

    const classPassBillAfterRefund = await ClassPass.findOne(classPassBill.id);
    comparePartialObject(
      classPassBillAfterRefund,
      {
        classes_left: 8,
      },
    );

    const populatedClass = _.cloneDeep(class1);
    populatedClass.signups = [signup1, signup2];
    populatedClass.class_type = fixtures.classTypeYoga;

    assert.deepStrictEqual(
      smsSendFake.callCount,
      2,
    );

    assert.deepStrictEqual(
      emailSendFake.callCount,
      2,
    );


    await Membership.destroy({id: membershipAlice.id});
    await ClassPass.destroy({id: classPassBill.id});
    await Class.destroy({id: class1.id});
    await ClassSignup.destroy({id: [signup1.id, signup2.id]});

  });

  it('should succeed if class has signups and waiting list and livestream_signups', async () => {

    const class1 = await Class.create({
      client: testClientId,
      class_type: fixtures.classTypeYoga.id,
      date: '2019-05-15',
      start_time: '12:00:00',
      end_time: '14:00:00',
      seats: 2,
    }).fetch();

    const membershipAlice = await Membership.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'active',
      paid_until: '2019-06-15',
    }).fetch();
    const classPassAlice = await ClassPass.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      class_pass_type: fixtures.classPassTypeYogaTenClasses.id,
      classes_left: 7,
    }).fetch();

    const membershipBill = await Membership.create({
      client: testClientId,
      user: fixtures.userBill.id,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'active',
      paid_until: '2019-06-15',
    }).fetch();
    const classPassBill = await ClassPass.create({
      client: testClientId,
      user: fixtures.userBill.id,
      class_pass_type: fixtures.classPassTypeYogaTenClasses.id,
      classes_left: 7,
    }).fetch();

    const membershipCharlie = await Membership.create({
      client: testClientId,
      user: fixtures.userCharlie.id,
      membership_type: fixtures.membershipTypeYogaUnlimitedLivestream.id,
      status: 'active',
      paid_until: '2019-06-15',
    }).fetch();
    const classPassCharlie = await ClassPass.create({
      client: testClientId,
      user: fixtures.userCharlie.id,
      class_pass_type: fixtures.classPassTypeYogaTenClassesLivestream.id,
      classes_left: 3,
    }).fetch();

    const classSignupAlice1 = await ClassSignup.create({
      class: class1.id,
      user: fixtures.userAlice.id,
      used_membership: membershipAlice.id,
      client: testClientId,
    }).fetch();
    const classSignupAlice2 = await ClassSignup.create({
      class: class1.id,
      user: fixtures.userAlice.id,
      used_class_pass: classPassAlice.id,
      class_pass_seat_spent: true,
      client: testClientId,
    }).fetch();

    const waitingListSignupBill1 = await ClassWaitingListSignup.create({
      class: class1.id,
      user: fixtures.userBill.id,
      used_membership: membershipBill.id,
      client: testClientId,
    }).fetch();
    const waitingListSignupBill2 = await ClassWaitingListSignup.create({
      class: class1.id,
      user: fixtures.userBill.id,
      used_class_pass: classPassBill.id,
      class_pass_seat_spent: true,
      client: testClientId,
    }).fetch();

    const livestreamSignupCharlie1 = await ClassLivestreamSignup.create({
      class: class1.id,
      user: fixtures.userCharlie.id,
      used_membership: membershipCharlie.id,
      client: testClientId,
    }).fetch();
    const livestreamSignupCharlie2 = await ClassLivestreamSignup.create({
      class: class1.id,
      user: fixtures.userCharlie.id,
      used_class_pass: classPassCharlie.id,
      class_pass_seat_spent: true,
      client: testClientId,
    }).fetch();

    const timestampBeforeCancel = Date.now();
    await supertest(sails.hooks.http.app)
      .put('/classes/' + class1.id + '/cancel?client=' + testClientId)
      .use(authorizeAdmin())
      .expect(200);
    const timestampAfterCancel = Date.now();

    const cancelledClass = await Class.findOne(class1.id);
    assert(cancelledClass.cancelled === true);

    const updatedClassSignups = await ClassSignup.find({
      id: [classSignupAlice1.id, classSignupAlice2.id],
    }).sort('id');

    expect(updatedClassSignups).to.matchPattern(`[     
        {
          archived: false,
          cancelled_at: 0,
          class_pass_seat_spent: null,
          ...
        },
        {
          archived: false,
          cancelled_at: 0,
          class_pass_seat_spent: false,
          ...
        },
      ]`,
    );

    const updatedWaitingListSignups = await ClassWaitingListSignup.find({
      id: [waitingListSignupBill1.id, waitingListSignupBill2.id],
    }).sort('id');

    expect(updatedWaitingListSignups).to.matchPattern(`[
      {
        cancelled_at: _.isBetween|${timestampBeforeCancel - 1}|${timestampAfterCancel + 1},
        archived: false,
        class_pass_seat_spent: false,
        ...
      },
      {
        cancelled_at: _.isBetween|${timestampBeforeCancel - 1}|${timestampAfterCancel + 1},
        archived: false,
        class_pass_seat_spent: false,
        ...
      }
    ]`);

    const updatedLivestreamSignups = await ClassLivestreamSignup.find({
      id: [livestreamSignupCharlie1.id, livestreamSignupCharlie2.id],
    }).sort('id');

    expect(updatedLivestreamSignups).to.matchPattern(`[
      {
        cancelled_at: 0,
        archived: false,
        class_pass_seat_spent: null,
        ...
      },
      {
        cancelled_at: 0,
        archived: false,
        class_pass_seat_spent: false,
        ...
      }
    ]`);

    const classPassAliceAfterRefund = await ClassPass.findOne(classPassAlice.id);
    expect(classPassAliceAfterRefund).to.matchPattern(`
      {
        classes_left: 8,
        ...
      }`,
    );

    const classPassBillAfterRefund = await ClassPass.findOne(classPassBill.id);
    expect(classPassBillAfterRefund).to.matchPattern(`
      {
        classes_left: 8,
        ...
      }`,
    );

    const classPassCharlieAfterRefund = await ClassPass.findOne(classPassCharlie.id);
    expect(classPassCharlieAfterRefund).to.matchPattern(`
      {
        classes_left: 4,
        ...
      }`,
    );

    expect(smsSendFake.callCount).to.equal(4);
    expect(smsSendFake.getCall(0).args[0]).to.matchPattern(`{
      user: {
        first_name: 'Alice',
        ...
      },
      message: 'Dear Alice,\\n\\nUnfortunately, we have to cancel Yoga, Wednesday, May 15, 2019 at 12:00.\\n\\nIf you used a class pass with a fixed number of classes to sign up, the class has been returned.\\n\\nKind regards,\\nTest client',
      type: 'class_cancelled',
    }`);
    expect(smsSendFake.getCall(1).args[0]).to.matchPattern(`{
      user: {
        first_name: 'Alice',
        ...
      },
      message: 'Dear Alice,\\n\\nUnfortunately, we have to cancel Yoga, Wednesday, May 15, 2019 at 12:00.\\n\\nIf you used a class pass with a fixed number of classes to sign up, the class has been returned.\\n\\nKind regards,\\nTest client',
      type: 'class_cancelled',
    }`);
    expect(smsSendFake.getCall(2).args[0]).to.matchPattern(`{
      user: {
        first_name: 'Charlie',
        ...
      },
      message: 'Dear Charlie,\\n\\nUnfortunately, we have to cancel Yoga, Wednesday, May 15, 2019 at 12:00.\\n\\nIf you used a class pass with a fixed number of classes to sign up, the class has been returned.\\n\\nKind regards,\\nTest client',
      type: 'class_cancelled',
    }`);
    expect(smsSendFake.getCall(3).args[0]).to.matchPattern(`{
      user: {
        first_name: 'Charlie',
        ...
      },
      message: 'Dear Charlie,\\n\\nUnfortunately, we have to cancel Yoga, Wednesday, May 15, 2019 at 12:00.\\n\\nIf you used a class pass with a fixed number of classes to sign up, the class has been returned.\\n\\nKind regards,\\nTest client',
      type: 'class_cancelled',
    }`);

    expect(emailSendFake.callCount).to.equal(6);
    expect(emailSendFake.getCall(0).args[0]).to.matchPattern(`{      
      user: {id: ${fixtures.userAlice.id}, ... },
      subject: 'CANCELLED: Yoga, Wednesday, May 15, 2019 at 12:00',
      text: 'Dear Alice,\\n\\nUnfortunately, we have to cancel Yoga, Wednesday, May 15, 2019 at 12:00.\\n\\nIf you used a class pass with a fixed number of classes to sign up, the class has been returned.\\n\\nKind regards,\\nTest client',
      blindCopyToClient: false,
      emailType: 'your_class_has_been_cancelled',
    }`);
    expect(emailSendFake.getCall(1).args[0]).to.matchPattern(`{      
      user: {id: ${fixtures.userAlice.id}, ... },
      subject: 'CANCELLED: Yoga, Wednesday, May 15, 2019 at 12:00',
      text: 'Dear Alice,\\n\\nUnfortunately, we have to cancel Yoga, Wednesday, May 15, 2019 at 12:00.\\n\\nIf you used a class pass with a fixed number of classes to sign up, the class has been returned.\\n\\nKind regards,\\nTest client',
      blindCopyToClient: false,
      emailType: 'your_class_has_been_cancelled',
    }`);

    expect(emailSendFake.getCall(2).args[0]).to.matchPattern(`{     
      user: {id: ${fixtures.userBill.id}, ...},
      subject: 'CANCELLED: Yoga, Wednesday, May 15, 2019 at 12:00',
      text: 'Dear Bill,\\n\\nUnfortunately, we have to cancel Yoga, Wednesday, May 15, 2019 at 12:00, which you are on the waitlist for.\\n\\nIf you used a class pass with a fixed number of classes to sign up, the class has been returned.\\n\\nKind regards,\\nTest client',
      blindCopyToClient: false,
      emailType: 'your_waiting_list_class_has_been_cancelled',
    }`);
    expect(emailSendFake.getCall(3).args[0]).to.matchPattern(`{     
      user: {id: ${fixtures.userBill.id}, ...},
      subject: 'CANCELLED: Yoga, Wednesday, May 15, 2019 at 12:00',
      text: 'Dear Bill,\\n\\nUnfortunately, we have to cancel Yoga, Wednesday, May 15, 2019 at 12:00, which you are on the waitlist for.\\n\\nIf you used a class pass with a fixed number of classes to sign up, the class has been returned.\\n\\nKind regards,\\nTest client',
      blindCopyToClient: false,
      emailType: 'your_waiting_list_class_has_been_cancelled',
    }`);

    expect(emailSendFake.getCall(4).args[0]).to.matchPattern(`{      
      user: {id: ${fixtures.userCharlie.id}, ... },
      subject: 'CANCELLED: Yoga, Wednesday, May 15, 2019 at 12:00',
      text: 'Dear Charlie,\\n\\nUnfortunately, we have to cancel Yoga, Wednesday, May 15, 2019 at 12:00.\\n\\nIf you used a class pass with a fixed number of classes to sign up, the class has been returned.\\n\\nKind regards,\\nTest client',
      blindCopyToClient: false,
      emailType: 'your_class_has_been_cancelled',
    }`);
    expect(emailSendFake.getCall(5).args[0]).to.matchPattern(`{      
      user: {id: ${fixtures.userCharlie.id}, ... },
      subject: 'CANCELLED: Yoga, Wednesday, May 15, 2019 at 12:00',
      text: 'Dear Charlie,\\n\\nUnfortunately, we have to cancel Yoga, Wednesday, May 15, 2019 at 12:00.\\n\\nIf you used a class pass with a fixed number of classes to sign up, the class has been returned.\\n\\nKind regards,\\nTest client',
      blindCopyToClient: false,
      emailType: 'your_class_has_been_cancelled',
    }`);

    const logEntryAlice = await ClassPassLog.find({class_pass_id: classPassAlice.id});
    expect(logEntryAlice).to.matchPattern(`[
      {
        client_id: ${testClientId},
        entry: 'Class pass was refunded because Yoga, Wednesday, May 15, 2019 12:00 was cancelled. Class pass now has 8 classes left.',
        class_pass_id: ${classPassAlice.id},
        createdAt: _.isBetween|${timestampBeforeCancel - 1}|${timestampAfterCancel + 1},
        updatedAt: _.isBetween|${timestampBeforeCancel - 1}|${timestampAfterCancel + 1},
        user_id: ${fixtures.userAlice.id},
        archived: false,
        id: _.isInteger
      }     
    ]`);
    const logEntryBill = await ClassPassLog.find({class_pass_id: classPassBill.id});
    expect(logEntryBill).to.matchPattern(`[
      {
        client_id: ${testClientId},
        entry: 'Class pass was refunded because Yoga, Wednesday, May 15, 2019 12:00 was cancelled. Class pass now has 8 classes left.',
        class_pass_id: ${classPassBill.id},
        createdAt: _.isBetween|${timestampBeforeCancel - 1}|${timestampAfterCancel + 1},
        updatedAt: _.isBetween|${timestampBeforeCancel - 1}|${timestampAfterCancel + 1},
        user_id: ${fixtures.userBill.id},
        archived: false,
        id: _.isInteger
      }     
    ]`);

    const logEntryCharlie = await ClassPassLog.find({class_pass_id: classPassCharlie.id});
    expect(logEntryCharlie).to.matchPattern(`[
      {
        client_id: ${testClientId},
        entry: 'Class pass was refunded because Yoga, Wednesday, May 15, 2019 12:00 was cancelled. Class pass now has 4 classes left.',
        class_pass_id: ${classPassCharlie.id},
        createdAt: _.isBetween|${timestampBeforeCancel - 1}|${timestampAfterCancel + 1},
        updatedAt: _.isBetween|${timestampBeforeCancel - 1}|${timestampAfterCancel + 1},
        user_id: ${fixtures.userCharlie.id},
        archived: false,
        id: _.isInteger
      }     
    ]`);

    await Membership.destroy({id: [membershipAlice.id, membershipBill.id, membershipCharlie.id]});
    await ClassPass.destroy({id: [classPassAlice.id, classPassBill.id, classPassCharlie.id]});
    await Class.destroy({id: class1.id});
    await ClassSignup.destroy({
      id: [
        classSignupAlice1.id,
        classSignupAlice2.id,
      ],
    });
    await ClassWaitingListSignup.destroy({
      id: [
        waitingListSignupBill1.id,
        waitingListSignupBill2.id,
      ],
    });
    await ClassLivestreamSignup.destroy({
      id: [
        livestreamSignupCharlie1.id,
        livestreamSignupCharlie2.id,
      ],
    });

  });

  it('should disregard archived and cancelled signups', async () => {

    const class1 = await Class.create({
      client: testClientId,
      class_type: fixtures.classTypeYoga.id,
      date: '2019-05-15',
      start_time: '12:00:00',
      end_time: '14:00:00',
      seats: 2,
    }).fetch();

    const signups = await Promise.all([
      ClassSignup.create({
        class: class1.id,
        user: fixtures.userAlice.id,
        archived: true,
        client: testClientId,
      }).fetch(),
      ClassSignup.create({
        class: class1.id,
        user: fixtures.userAlice.id,
        cancelled_at: Date.now(),
        client: testClientId,
      }).fetch(),

      ClassWaitingListSignup.create({
        class: class1.id,
        user: fixtures.userBill.id,
        archived: true,
        client: testClientId,
      }).fetch(),
      ClassWaitingListSignup.create({
        class: class1.id,
        user: fixtures.userBill.id,
        cancelled_at: Date.now(),
        client: testClientId,
      }).fetch(),

      ClassLivestreamSignup.create({
        class: class1.id,
        user: fixtures.userCharlie.id,
        archived: true,
        client: testClientId,
      }).fetch(),
      ClassLivestreamSignup.create({
        class: class1.id,
        user: fixtures.userCharlie.id,
        cancelled_at: Date.now(),
        client: testClientId,
      }).fetch(),
    ]);

    await supertest(sails.hooks.http.app)
      .put('/classes/' + class1.id + '/cancel?client=' + testClientId)
      .use(authorizeAdmin())
      .expect(200);

    const cancelledClass = await Class.findOne(class1.id);
    assert(cancelledClass.cancelled === true);

    expect(smsSendFake.callCount).to.equal(0);
    expect(emailSendFake.callCount).to.equal(0);

    await Class.destroy({id: class1.id});
    await ClassSignup.destroy({
      id: [
        signups[0].id,
        signups[1].id,
      ],
    });
    await ClassWaitingListSignup.destroy({
      id: [
        signups[2].id,
        signups[3].id,
      ],
    });
    await ClassLivestreamSignup.destroy({
      id: [
        signups[4].id,
        signups[5].id,
      ],
    });

  });

});
