const assert = require('assert');

const assertAsyncThrows = require('../../../utils/assert-async-throws');

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID;
const fixtures = require('../../../fixtures/factory').fixtures;

const MockDate = require('mockdate');
const moment = require('moment-timezone');

const emailSendFakeFactory = require('../../../fakes/email-send-fake-factory');
const sinon = require('sinon');

describe('helpers.classSignups.destroy', async function () {

  let emailSendFake,
    clientSettingsRowSendEmail;

  let class1;

  let userAliceReq;

  before(async () => {

    userAliceReq = {
      user: fixtures.userAlice,
    };

    class1 = await Class.create({
      date: '2018-05-15',
      start_time: '12:00:00',
      end_time: '14:00:00',
      client: testClientId,
      class_type: fixtures.classTypeYoga.id,
    }).fetch();

  });

  beforeEach(async () => {
    await ClassPassLog.destroy({});
    emailSendFake = emailSendFakeFactory.installEmailSendFake();
    clientSettingsRowSendEmail = await ClientSettings.create({
      client: testClientId,
      key: 'no_show_fees_send_emails_on_apply_and_cancel',
      value: 1,
    }).fetch();
  });

  afterEach(async () => {
    sinon.restore();
    await ClientSettings.destroy({id: clientSettingsRowSendEmail.id});
  });

  after(async () => {

    await Class.destroy({
      id: class1.id,
    });

  });


  it('should throw "signupNotFound" if signup does not exist', async () => {

    // Test with signup id
    await assertAsyncThrows(
      async () => {
        await sails.helpers.classSignups.destroy.with({
          signup: 9999999,
          userGetsRefundAfterDeadline: true,
        });
      },
      'signupNotFound',
    );

    // Test with signup object
    await assertAsyncThrows(
      async () => {
        await sails.helpers.classSignups.destroy.with({
          signup: {
            id: 9999999,
          },
          userGetsRefundAfterDeadline: true,
        });
      },
      'signupNotFound',
    );

  });

  it('should return "Signup already cancelled." if signup is cancelled.', async () => {

    const signup = await ClassSignup.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      'class': class1.id,
      cancelled_at: Date.now(),
    }).fetch();

    const result = await sails.helpers.classSignups.destroy.with({
      signup: signup,
      userGetsRefundAfterDeadline: true,
    });

    assert.equal(
      result,
      'Signup already cancelled.',
    );

    await ClassSignup.destroy({id: signup.id});

  });


  it('should refund class to class pass if user is customer and deadline has not been passed.', async () => {

    const classPass = await ClassPass.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      class_pass_type: fixtures.classPassTypeYogaTenClasses.id,
      classes_left: 5,
    }).fetch();

    const signup = await ClassSignup.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      'class': class1.id,
      used_class_pass: classPass.id,
    }).fetch();

    // Deadline is 2 hours = 2018-05-15 10:00:00
    MockDate.set(moment.tz('2018-05-15 09:59:58', 'Europe/Copenhagen'));

    await sails.helpers.classSignups.destroy.with({
      signup: signup,
      userGetsRefundAfterDeadline: false,
    });

    const updatedSignup = await ClassSignup.findOne(signup.id);

    expect(updatedSignup).to.matchPattern(`{
      archived: false,
      cancelled_at: _.isGreaterThan|0,
      ...
      }`,
    );

    const updatedClassPass = await ClassPass.findOne(classPass.id);

    assert.equal(
      updatedClassPass.classes_left,
      6,
    );

    const logEntry = await ClassPassLog.find({class_pass_id: classPass.id});
    expect(logEntry).to.matchPattern(`[
      {
        entry: 'Class pass was refunded because the sign-up for Yoga, Tuesday, May 15, 2018 12:00 was cancelled. Class pass now has 6 classes left.',
        ...
      }
    ]`);

    expect(emailSendFake.callCount).to.equal(0);

    await ClassSignup.destroy({id: signup.id});

  });

  it('should not apply fee to time-based class pass if user is customer and deadline has not been passed.', async () => {

    const classPass = await ClassPass.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      class_pass_type: fixtures.classPassTypeYogaUnlimitedOneMonth.id,
      valid_until: '2018-05-30',
    }).fetch();

    const signup = await ClassSignup.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      'class': class1.id,
      used_class_pass: classPass.id,
    }).fetch();

    // Deadline is 2 hours = 2018-05-15 10:00:00
    MockDate.set(moment.tz('2018-05-15 09:59:58', 'Europe/Copenhagen'));

    await sails.helpers.classSignups.destroy.with({
      signup: signup,
      userGetsRefundAfterDeadline: false,
    });

    const updatedSignup = await ClassSignup.findOne(signup.id);

    expect(updatedSignup).to.matchPattern(`{
      archived: false,
      cancelled_at: _.isGreaterThan|0,
      ...
      }`,
    );

    const updatedClassPass = await ClassPass.findOne(classPass.id);

    assert.equal(
      updatedClassPass.toJSON().valid_until,
      '2018-05-30',
    );

    const logEntry = await ClassPassLog.find({class_pass_id: classPass.id});
    expect(logEntry).to.matchPattern([]);

    expect(emailSendFake.callCount).to.equal(0);

    await ClassSignup.destroy({id: signup.id});

  });

  it('should not apply a fee if user is customer and deadline has not been passed. Membership.', async () => {

    const clientSettingsRows = await ClientSettings.createEach([{
      client: testClientId,
      key: 'no_show_fees_enabled',
      value: 1,
    },
      {
        client: testClientId,
        key: 'no_show_fees_apply_method',
        value: 'auto',
      },
    ]).fetch();

    const membership = await Membership.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'active',
    }).fetch();

    const signup = await ClassSignup.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      'class': class1.id,
      used_membership: membership.id,
    }).fetch();

    // Deadline is 2 hours = 2018-05-15 10:00:00
    MockDate.set(moment.tz('2018-05-15 09:59:59', 'Europe/Copenhagen'));

    const timestampBeforeCall = Date.now();
    await sails.helpers.classSignups.destroy.with({
      signup: signup,
      userGetsRefundAfterDeadline: false,
    });
    const timestampAfterCall = Date.now();

    const updatedSignup = await ClassSignup.findOne(signup.id);

    expect(updatedSignup).to.matchPattern(`{
      archived: false,
      cancelled_at: _.isBetween|${timestampBeforeCall - 1}|${timestampAfterCall + 1},
      ...
      }`,
    );

    const createdNoShowFee = await NoShowFee.find({class_signup_id: signup.id});
    expect(createdNoShowFee).to.matchPattern([]);

    const logEntries = await MembershipLog.find({membership: membership.id});
    expect(logEntries).to.matchPattern([]);

    expect(emailSendFake.callCount).to.equal(0);

    await ClassSignup.destroy({id: signup.id});
    await ClientSettings.destroy({id: _.map(clientSettingsRows, 'id')});
    await Membership.destroy({id: membership.id});
    await NoShowFee.destroy({id: createdNoShowFee.id});

  });

  it('should apply a fee if user is customer and deadline has been passed. Fixed count class pass', async () => {

    const clientSettingsRows = await ClientSettings.createEach([
      {
        client: testClientId,
        key: 'no_show_fees_enabled',
        value: 1,
      },
      {
        client: testClientId,
        key: 'no_show_fees_apply_method',
        value: 'auto',
      },
    ]).fetch();

    const classPass = await ClassPass.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      class_pass_type: fixtures.classPassTypeYogaTenClasses.id,
      classes_left: 5,
    }).fetch();

    const signup = await ClassSignup.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      'class': class1.id,
      used_class_pass: classPass.id,
      class_pass_seat_spent: true,
    }).fetch();

    // Deadline is 2 hours = 2018-05-15 10:00:00
    MockDate.set(moment.tz('2018-05-15 10:00:00', 'Europe/Copenhagen'));

    await sails.helpers.classSignups.destroy.with({
      signup: signup,
      userGetsRefundAfterDeadline: false,
    });

    const updatedSignup = await ClassSignup.findOne(signup.id);

    expect(updatedSignup).to.matchPattern(`{
      archived: false,
      cancelled_at: _.isGreaterThan|0,
      ...
      }`,
    );

    const updatedClassPass = await ClassPass.findOne(classPass.id);

    assert.equal(
      updatedClassPass.classes_left,
      5,
    );

    const fee = await NoShowFee.find({class_signup_id: signup.id});
    expect(fee).to.matchPattern(`[
      {
        amount: 0,
        days_deducted: 0,
        classes_spent: 1,
        ...
      }
    ]`);

    const logEntries = await ClassPassLog.find({class_pass_id: classPass.id});
    expect(logEntries).to.matchPattern(`[
      {
        entry: 'Fee added for late cancellation of Yoga, Tuesday, May 15, 2018 12:00, meaning the class will not be refunded to the class pass. Class pass now has 5 classes left.',
        ...
      }
    ]`);

    expect(emailSendFake.callCount).to.equal(1);
    expect(emailSendFake.getCall(0).args[0]).to.matchPattern({
      user: fixtures.userAlice.id,
      subject: 'Late cancellation fee applied',
      text: 'Dear Alice,\n\nYou have cancelled your registration for Yoga, Tuesday, May 15, 2018 12:00 after the cancellation deadline. Your class will not be refunded to your class pass.\n\nKind regards,\nTest client',
      emailType: 'email_late_cancel_fee_applied_fixed_count_class_pass',
    });

    await ClassSignup.destroy({id: signup.id});
    await ClientSettings.destroy({id: _.map(clientSettingsRows, 'id')});
    await ClassPass.destroy({id: classPass.id});
    await NoShowFee.destroy({id: fee.id});

  });

  it('should apply am active fee if user is customer and deadline has been passed even if apply_method is manual. Fixed count class pass', async () => {

    const clientSettingsRows = await ClientSettings.createEach([
      {
        client: testClientId,
        key: 'no_show_fees_enabled',
        value: 1,
      }],
    ).fetch();

    const classPass = await ClassPass.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      class_pass_type: fixtures.classPassTypeYogaTenClasses.id,
      classes_left: 5,
    }).fetch();

    const signup = await ClassSignup.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      'class': class1.id,
      used_class_pass: classPass.id,
      class_pass_seat_spent: true,
    }).fetch();

    // Deadline is 2 hours = 2018-05-15 10:00:00
    MockDate.set(moment.tz('2018-05-15 10:00:00', 'Europe/Copenhagen'));

    await sails.helpers.classSignups.destroy.with({
      signup: signup,
      userGetsRefundAfterDeadline: false,
    });

    const updatedSignup = await ClassSignup.findOne(signup.id);

    expect(updatedSignup).to.matchPattern(`{
      archived: false,
      cancelled_at: _.isGreaterThan|0,
      ...
      }`,
    );

    const updatedClassPass = await ClassPass.findOne(classPass.id);

    assert.equal(
      updatedClassPass.classes_left,
      5,
    );

    const fee = await NoShowFee.find({class_signup_id: signup.id});
    expect(fee).to.matchPattern(`[
      {
        amount: 0,
        days_deducted: 0,
        classes_spent: 1,
        ...
      }
    ]`);

    const logEntries = await ClassPassLog.find({class_pass_id: classPass.id});
    expect(logEntries).to.matchPattern(`[
      {
        entry: 'Fee added for late cancellation of Yoga, Tuesday, May 15, 2018 12:00, meaning the class will not be refunded to the class pass. Class pass now has 5 classes left.',
        ...
      }
    ]`);

    expect(emailSendFake.callCount).to.equal(1);
    expect(emailSendFake.getCall(0).args[0]).to.matchPattern({
      user: fixtures.userAlice.id,
      subject: 'Late cancellation fee applied',
      text: 'Dear Alice,\n\nYou have cancelled your registration for Yoga, Tuesday, May 15, 2018 12:00 after the cancellation deadline. Your class will not be refunded to your class pass.\n\nKind regards,\nTest client',
      emailType: 'email_late_cancel_fee_applied_fixed_count_class_pass',
    });

    await ClassSignup.destroy({id: signup.id});
    await ClientSettings.destroy({id: _.map(clientSettingsRows, 'id')});
    await ClassPass.destroy({id: classPass.id});
    await NoShowFee.destroy({id: fee.id});

  });

  it('should apply a fee if user is customer and deadline has been passed. Unlimited class pass', async () => {

    const clientSettingsRows = await ClientSettings.createEach([{
      client: testClientId,
      key: 'no_show_fees_enabled',
      value: 1,
    },
      {
        client: testClientId,
        key: 'no_show_fees_apply_method',
        value: 'auto',
      },
    ]).fetch();

    const classPass = await ClassPass.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      class_pass_type: fixtures.classPassTypeYogaUnlimitedOneMonth.id,
      valid_until: '2018-05-20',
    }).fetch();

    const signup = await ClassSignup.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      'class': class1.id,
      used_class_pass: classPass.id,
    }).fetch();

    // Deadline is 2 hours = 2018-05-15 10:00:00
    MockDate.set(moment.tz('2018-05-15 10:00:00', 'Europe/Copenhagen'));

    const timestampBeforeCall = Date.now();
    await sails.helpers.classSignups.destroy.with({
      signup: signup,
      userGetsRefundAfterDeadline: false,
    });
    const timestampAfterCall = Date.now();

    const updatedSignup = await ClassSignup.findOne(signup.id);

    expect(updatedSignup).to.matchPattern(`{
      archived: false,
      cancelled_at: _.isBetween|${timestampBeforeCall - 1}|${timestampAfterCall + 1},
      ...
      }`,
    );

    const updatedClassPass = (await ClassPass.findOne(classPass.id)).toJSON();
    expect(updatedClassPass).to.matchPattern(`{
      valid_until: '2018-05-19',
      ...
    }`);

    const fee = await NoShowFee.find({class_signup_id: signup.id});
    expect(fee).to.matchPattern(`[
      {
        amount: 0,
        days_deducted: 1,
        classes_spent: 0,
        ...
      }
    ]`);

    const logEntries = await ClassPassLog.find({class_pass_id: classPass.id});
    expect(logEntries).to.matchPattern(`[
      {
        entry: '1 day charged from class pass for late cancellation of Yoga, Tuesday, May 15, 2018 12:00. Class pass is now valid until Saturday, May 19, 2018.',
        ...
      }
    ]`);

    expect(emailSendFake.callCount).to.equal(1);
    expect(emailSendFake.getCall(0).args[0]).to.matchPattern({
      user: fixtures.userAlice.id,
      subject: 'Late cancellation fee applied',
      text: 'Dear Alice,\n\nDue to late cancellation of Yoga, Tuesday, May 15, 2018 12:00, we have charged a fee of 1 day from your class pass.\n\nKind regards,\nTest client',
      emailType: 'email_late_cancel_fee_applied_time_based_class_pass',
    });

    await ClassSignup.destroy({id: signup.id});
    await ClientSettings.destroy({id: _.map(clientSettingsRows, 'id')});
    await ClassPass.destroy({id: classPass.id});
    await NoShowFee.destroy({id: fee.id});

  });

  it('should apply an inactive fee if user is customer and deadline has been passed. Unlimited class pass', async () => {

    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'no_show_fees_enabled',
      value: 1,
    }).fetch();

    const classPass = await ClassPass.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      class_pass_type: fixtures.classPassTypeYogaUnlimitedOneMonth.id,
      valid_until: '2018-05-20',
    }).fetch();

    const signup = await ClassSignup.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      'class': class1.id,
      used_class_pass: classPass.id,
    }).fetch();

    // Deadline is 2 hours = 2018-05-15 10:00:00
    MockDate.set(moment.tz('2018-05-15 10:00:00', 'Europe/Copenhagen'));

    const timestampBeforeCall = Date.now() - 1;
    await sails.helpers.classSignups.destroy.with({
      signup: signup,
      userGetsRefundAfterDeadline: false,
    });
    const timestampAfterCall = Date.now() + 1;

    const updatedSignup = await ClassSignup.findOne(signup.id);

    expect(updatedSignup).to.matchPattern(`{
      archived: false,
      cancelled_at: _.isBetween|${timestampBeforeCall - 1}|${timestampAfterCall + 1},
      ...
      }`,
    );

    const updatedClassPass = (await ClassPass.findOne(classPass.id)).toJSON();
    expect(updatedClassPass).to.matchPattern(`{
      valid_until: '2018-05-20',
      ...
    }`);

    const fee = await NoShowFee.find({class_signup_id: signup.id});
    expect(fee).to.matchPattern(`[
      {
        amount: 0,
        days_deducted: 1,
        classes_spent: 0,
        cancelled_at: _.isBetween|${timestampBeforeCall}|${timestampAfterCall},
        ...
      }
    ]`);

    const logEntries = await ClassPassLog.find({class_pass_id: classPass.id});
    expect(logEntries).to.matchPattern(`[
      {
        entry: '1 day charged from class pass for late cancellation of Yoga, Tuesday, May 15, 2018 12:00 (pending review).',
        ...
      }
    ]`);

    expect(emailSendFake.callCount).to.equal(0);

    await ClassSignup.destroy({id: signup.id});
    await ClientSettings.destroy({id: clientSettingsRow.id});
    await ClassPass.destroy({id: classPass.id});
    await NoShowFee.destroy({id: fee.id});

  });

  it('should apply a fee if user is customer and deadline has been passed. Membership.', async () => {

    const clientSettingsRows = await ClientSettings.createEach([{
      client: testClientId,
      key: 'no_show_fees_enabled',
      value: 1,
    },
      {
        client: testClientId,
        key: 'no_show_fees_apply_method',
        value: 'auto',
      },
    ]).fetch();

    const membership = await Membership.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'active',
    }).fetch();

    const signup = await ClassSignup.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      'class': class1.id,
      used_membership: membership.id,
    }).fetch();

    // Deadline is 2 hours = 2018-05-15 10:00:00
    MockDate.set(moment.tz('2018-05-15 10:00:00', 'Europe/Copenhagen'));

    const timestampBeforeCall = Date.now();
    await sails.helpers.classSignups.destroy.with({
      signup: signup,
      userGetsRefundAfterDeadline: false,
    });
    const timestampAfterCall = Date.now();

    const updatedSignup = await ClassSignup.findOne(signup.id);

    expect(updatedSignup).to.matchPattern(`{
      archived: false,
      cancelled_at: _.isBetween|${timestampBeforeCall - 1}|${timestampAfterCall + 1},
      ...
      }`,
    );

    const createdNoShowFee = await NoShowFee.find({class_signup_id: signup.id});
    expect(createdNoShowFee).to.matchPattern(`[
      {
        createdAt: _.isInteger,
        updatedAt: _.isInteger,
        id: _.isInteger,
        archived: false,
        client_id: ${testClientId},
        class_id: ${class1.id},
        user_id: ${fixtures.userAlice.id},
        amount: 30,
        days_deducted: 0,
        classes_spent:0,
        reason: 'late_cancel',
        cancelled_at: 0,
        class_signup_id: ${signup.id},
        paid_with_order_id: null,
        class_pass_id: null,
        membership_id: ${membership.id}
      }
    ]`);

    const logEntries = await MembershipLog.find({membership: membership.id});
    expect(logEntries).to.matchPattern(`[
      {
        entry: 'A fee of 30 kr has been added for late cancellation of Yoga, Tuesday, May 15, 2018 12:00.',
        ...
      }
    ]`);

    expect(emailSendFake.callCount).to.equal(1);
    expect(emailSendFake.getCall(0).args[0]).to.matchPattern({
      user: fixtures.userAlice.id,
      subject: 'Late cancellation fee applied',
      text: 'Dear Alice,\n\nDue to late cancellation of Yoga, Tuesday, May 15, 2018 12:00, we have applied a fee of 30 kr to your membership.\n\nThe fee will be charged with you next automatic payment.\n\nKind regards,\nTest client',
      emailType: 'email_late_cancel_fee_applied_membership',
    });

    await ClassSignup.destroy({id: signup.id});
    await ClientSettings.destroy({id: _.map(clientSettingsRows, 'id')});
    await Membership.destroy({id: membership.id});
    await NoShowFee.destroy({id: createdNoShowFee.id});

  });

  it('should apply an inactive fee if user is customer and deadline has been passed. Membership.', async () => {

    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'no_show_fees_enabled',
      value: 1,
    }).fetch();

    const membership = await Membership.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'active',
    }).fetch();

    const signup = await ClassSignup.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      'class': class1.id,
      used_membership: membership.id,
    }).fetch();

    // Deadline is 2 hours = 2018-05-15 10:00:00
    MockDate.set(moment.tz('2018-05-15 10:00:00', 'Europe/Copenhagen'));

    const timestampBeforeCall = Date.now() - 1;
    await sails.helpers.classSignups.destroy.with({
      signup: signup,
      userGetsRefundAfterDeadline: false,
    });
    const timestampAfterCall = Date.now() + 1;

    const updatedSignup = await ClassSignup.findOne(signup.id);

    expect(updatedSignup).to.matchPattern(`{
      archived: false,
      cancelled_at: _.isBetween|${timestampBeforeCall}|${timestampAfterCall},
      ...
      }`,
    );

    const createdNoShowFee = await NoShowFee.find({class_signup_id: signup.id});
    expect(createdNoShowFee).to.matchPattern(`[
      {
        createdAt: _.isInteger,
        updatedAt: _.isInteger,
        id: _.isInteger,
        archived: false,
        client_id: ${testClientId},
        class_id: ${class1.id},
        user_id: ${fixtures.userAlice.id},
        amount: 30,
        days_deducted: 0,
        classes_spent:0,
        reason: 'late_cancel',
        cancelled_at: _.isBetween|${timestampBeforeCall}|${timestampAfterCall},
        class_signup_id: ${signup.id},
        paid_with_order_id: null,
        class_pass_id: null,
        membership_id: ${membership.id}
      }
    ]`);

    const logEntries = await MembershipLog.find({membership: membership.id});
    expect(logEntries).to.matchPattern(`[
      {
        entry: 'A fee of 30 kr has been added for late cancellation of Yoga, Tuesday, May 15, 2018 12:00 (pending review).',
        ...
      }
    ]`);

    expect(emailSendFake.callCount).to.equal(0);

    await ClassSignup.destroy({id: signup.id});
    await ClientSettings.destroy({id: clientSettingsRow.id});
    await Membership.destroy({id: membership.id});
    await NoShowFee.destroy({id: createdNoShowFee.id});

  });

  it('should refund class to class pass if user is admin, even though deadline has been passed.', async () => {

    const classPass = await ClassPass.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      class_pass_type: fixtures.classPassTypeYogaTenClasses.id,
      classes_left: 5,
    }).fetch();

    const signup = await ClassSignup.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      'class': class1.id,
      used_class_pass: classPass.id,
    }).fetch();

    // Deadline is 2 hours = 2018-05-15 10:00:00
    MockDate.set(moment.tz('2018-05-15 10:00:00', 'Europe/Copenhagen'));

    await sails.helpers.classSignups.destroy.with({
      signup: signup,
      userGetsRefundAfterDeadline: true,
    });

    const updatedSignup = await ClassSignup.findOne(signup.id);

    expect(updatedSignup).to.matchPattern(`{
      archived: false,
      cancelled_at: _.isGreaterThan|0,
      ...
      }`,
    );

    const updatedClassPass = await ClassPass.findOne(classPass.id);

    assert.equal(
      updatedClassPass.classes_left,
      6,
    );

    const logEntry = await ClassPassLog.find({class_pass_id: classPass.id});
    expect(logEntry).to.matchPattern(`[
      {
        entry:'Class pass was refunded because the sign-up for Yoga, Tuesday, May 15, 2018 12:00 was cancelled. Class pass now has 6 classes left.',
        ...
      }
    ]`);

    await ClassSignup.destroy({id: signup.id});

  });

  it('should accept and log the reason if a class pass is not refunded', async () => {
    const classPass = await ClassPass.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      class_pass_type: fixtures.classPassTypeYogaTenClasses.id,
      classes_left: 5,
      archived: true,
    }).fetch();

    const signup = await ClassSignup.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      'class': class1.id,
      used_class_pass: classPass.id,
    }).fetch();

    // Deadline is 2 hours = 2018-05-15 10:00:00
    MockDate.set(moment.tz('2018-05-15 09:59:59', 'Europe/Copenhagen'));

    const timestampBeforeCall = Date.now() - 1;
    await sails.helpers.classSignups.destroy.with({
      signup: signup,
      userGetsRefundAfterDeadline: false,
    });
    const timestampAfterCall = Date.now() + 1;

    const updatedSignup = await ClassSignup.findOne(signup.id);

    expect(updatedSignup).to.matchPattern(`{
      archived: false,
      cancelled_at: _.isBetween|${timestampBeforeCall}|${timestampAfterCall},
      ...
      }`,
    );

    const updatedClassPass = await ClassPass.findOne(classPass.id);

    assert.equal(
      updatedClassPass.classes_left,
      5,
    );

    const logEntry = await ClassPassLog.find({class_pass_id: classPass.id});
    expect(logEntry).to.matchPattern(`[
      {
        entry: 'Class pass not refunded for cancellation of sign-up for Yoga, Tuesday, May 15, 2018 12:00. Reason: Class pass is archived. Class pass now has 5 classes left.',
        ...
      }
    ]`);

    expect(emailSendFake.callCount).to.equal(0);

    await ClassSignup.destroy({id: signup.id});
  })

});
