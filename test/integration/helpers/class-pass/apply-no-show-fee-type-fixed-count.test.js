const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID;
const fixtures = require('../../../fixtures/factory').fixtures;
const emailSendFakeFactory = require('../../../fakes/email-send-fake-factory');
const sinon = require('sinon')

describe('helpers.class-pass.apply-no-show-fee-type-fixed-count', async function () {

  let emailSendFake,
    clientSettingsRowSendEmail;

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

  it('should apply a no-show fee to a class signup', async () => {

    const classObj = await Class.create({
      client: testClientId,
      date: '2020-05-15',
      start_time: '10:00:00',
      end_time: '12:00:00',
      class_type: fixtures.classTypeYoga.id,
    }).fetch();

    const classPass = await ClassPass.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      class_pass_type: fixtures.classPassTypeYogaTenClasses.id,
      classes_left: 5,
    }).fetch();

    const signup = await ClassSignup.create({
      client: testClientId,
      class: classObj.id,
      user: fixtures.userAlice.id,
      used_class_pass: classPass.id,
      class_pass_seat_spent: 1,
    }).fetch();

    await sails.helpers.classPass.applyNoShowFeeTypeFixedCount.with({
      signup,
      reason: 'no_show',
    });

    const updatedSignup = await ClassSignup.findOne(signup.id);

    expect(updatedSignup).to.matchPattern(`{
      client: ${testClientId},
      class: ${classObj.id},
      user: ${fixtures.userAlice.id},
      used_class_pass: ${classPass.id},
      no_show_fee_applied: true,
      ...
    }`);

    const createdFee = await NoShowFee.find({class_signup_id: signup.id});

    expect(createdFee).to.matchPattern(`[
      {
        client_id: ${testClientId},
        class_id: ${classObj.id},
        user_id: ${fixtures.userAlice.id},
        classes_spent: 1,
        class_signup_id: ${signup.id},
        reason: 'no_show',
        cancelled_at: 0,
        ...
      }
    ]`);

    const [logEntry] = await ClassPassLog.find({class_pass_id: classPass.id});

    expect(logEntry).to.matchPattern(`
      {
        client_id: ${testClientId},
        user_id: ${fixtures.userAlice.id},
        class_pass_id: ${classPass.id},
        entry: 'Fee added for non-attendance at Yoga, Friday, May 15, 2020 10:00, meaning the class will not be refunded to the class pass. Class pass now has 5 classes left.',
        ...
      }`,
    );

    expect(emailSendFake.callCount).to.equal(1);
    expect(emailSendFake.getCall(0).args[0]).to.matchPattern({
      user: fixtures.userAlice.id,
      subject: 'No-show fee applied',
      text: 'Dear Alice,\n\nYou did not attend Yoga, Friday, May 15, 2020 10:00. Your class will not be refunded to your class pass.\n\nKind regards,\nTest client',
      emailType: 'email_no_show_fee_applied_fixed_count_class_pass',
    });

    await NoShowFee.destroy({id: createdFee.id});
    await ClassPassLog.destroy({id: logEntry.id});
    await Class.destroy({id: classObj.id});
    await ClassSignup.destroy({id: signup.id});
    await ClassPass.destroy({id: classPass.id});

  });

  it('should apply a late cancellation fee to a class signup', async () => {

    const classObj = await Class.create({
      client: testClientId,
      date: '2020-05-15',
      start_time: '10:00:00',
      end_time: '12:00:00',
      class_type: fixtures.classTypeYoga.id,
    }).fetch();

    const classPass = await ClassPass.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      class_pass_type: fixtures.classPassTypeYogaTenClasses.id,
      classes_left: 5,
    }).fetch();

    const signup = await ClassSignup.create({
      client: testClientId,
      class: classObj.id,
      user: fixtures.userAlice.id,
      used_class_pass: classPass.id,
      class_pass_seat_spent: 1,
    }).fetch();

    await sails.helpers.classPass.applyNoShowFeeTypeFixedCount.with({
      signup,
      reason: 'late_cancel',
    });

    const updatedSignup = await ClassSignup.findOne(signup.id);

    expect(updatedSignup).to.matchPattern(`{
      client: ${testClientId},
      class: ${classObj.id},
      user: ${fixtures.userAlice.id},
      used_class_pass: ${classPass.id},
      no_show_fee_applied: true,
      ...
    }`);

    const createdFee = await NoShowFee.find({class_signup_id: signup.id});

    expect(createdFee).to.matchPattern(`[
      {
        client_id: ${testClientId},
        class_id: ${classObj.id},
        user_id: ${fixtures.userAlice.id},
        classes_spent: 1,
        class_signup_id: ${signup.id},
        reason: 'late_cancel',
        cancelled_at: 0,
        ...
      }
    ]`);

    const [logEntry] = await ClassPassLog.find({class_pass_id: classPass.id});

    expect(logEntry).to.matchPattern(`
      {
        client_id: ${testClientId},
        user_id: ${fixtures.userAlice.id},
        class_pass_id: ${classPass.id},
        entry: 'Fee added for late cancellation of Yoga, Friday, May 15, 2020 10:00, meaning the class will not be refunded to the class pass. Class pass now has 5 classes left.',
        ...
      }`,
    );

    expect(emailSendFake.callCount).to.equal(1);
    expect(emailSendFake.getCall(0).args[0]).to.matchPattern({
      user: fixtures.userAlice.id,
      subject: 'Late cancellation fee applied',
      text: 'Dear Alice,\n\nYou have cancelled your registration for Yoga, Friday, May 15, 2020 10:00 after the cancellation deadline. Your class will not be refunded to your class pass.\n\nKind regards,\nTest client',
      emailType: 'email_late_cancel_fee_applied_fixed_count_class_pass',
    });

    await NoShowFee.destroy({id: createdFee.id});
    await ClassPassLog.destroy({id: logEntry.id});
    await Class.destroy({id: classObj.id});
    await ClassSignup.destroy({id: signup.id});
    await ClassPass.destroy({id: classPass.id});

  });

  it('should make a log entry and send email in Danish', async () => {

    const oldLocale = sails.yogo ? sails.yogo.locale : undefined;
    sails.yogo = sails.yogo || {};
    sails.yogo.locale = 'da';

    // And client setting locale, which is used for the date in the log entry
    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'locale',
      value: 'da',
    }).fetch();

    const classObj = await Class.create({
      client: testClientId,
      date: '2020-05-15',
      start_time: '10:00:00',
      end_time: '12:00:00',
      class_type: fixtures.classTypeYoga.id,
    }).fetch();

    const classPass = await ClassPass.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      class_pass_type: fixtures.classPassTypeYogaTenClasses.id,
      classes_left: 5,
    }).fetch();

    const signup = await ClassSignup.create({
      client: testClientId,
      class: classObj.id,
      user: fixtures.userAlice.id,
      used_class_pass: classPass.id,
      class_pass_seat_spent: 1,
    }).fetch();

    await sails.helpers.classPass.applyNoShowFeeTypeFixedCount.with({
      signup,
      reason: 'no_show',
    });

    const updatedSignup = await ClassSignup.findOne(signup.id);

    expect(updatedSignup).to.matchPattern(`{
      client: ${testClientId},
      class: ${classObj.id},
      user: ${fixtures.userAlice.id},
      used_class_pass: ${classPass.id},
      no_show_fee_applied: true,
      ...
    }`);

    const createdFee = await NoShowFee.find({class_signup_id: signup.id});

    expect(createdFee).to.matchPattern(`[
      {
        client_id: ${testClientId},
        class_id: ${classObj.id},
        user_id: ${fixtures.userAlice.id},
        classes_spent: 1,
        class_signup_id: ${signup.id},
        reason: 'no_show',
        cancelled_at: 0,
        ...
      }
    ]`);

    const [logEntry] = await ClassPassLog.find({class_pass_id: classPass.id});

    expect(logEntry).to.matchPattern(`
      {
        client_id: ${testClientId},
        user_id: ${fixtures.userAlice.id},
        class_pass_id: ${classPass.id},
        entry: 'Gebyr pålagt for manglende fremmøde til Yoga, fredag d. 15. maj 2020 10:00, hvilket vil sige at klippet ikke returneres til klippekortet. Der er nu 5 klip tilbage på kortet.',
        ...
      }`,
    );

    expect(emailSendFake.callCount).to.equal(1);
    expect(emailSendFake.getCall(0).args[0]).to.matchPattern({
      user: fixtures.userAlice.id,
      subject: 'Gebyr for manglende fremmøde pålagt',
      text: 'Kære Alice\n\nDu er udeblevet fra Yoga, fredag d. 15. maj 2020 kl. 10:00. Dit klip vil ikke blive refunderet.\n\nMed venlig hilsen\nTest client',
      emailType: 'email_no_show_fee_applied_fixed_count_class_pass',
    });

    await NoShowFee.destroy({id: createdFee.id});
    await ClassPassLog.destroy({id: logEntry.id});
    await Class.destroy({id: classObj.id});
    await ClassSignup.destroy({id: signup.id});
    await ClassPass.destroy({id: classPass.id});

    sails.yogo.locale = oldLocale;
    await ClientSettings.destroy({
      id: clientSettingsRow.id,
    });

  });


  it('should only apply fee once on two simultaneous requests', async () => {

    const classObj = await Class.create({
      client: testClientId,
      date: '2020-05-15',
      start_time: '10:00:00',
      end_time: '12:00:00',
      class_type: fixtures.classTypeYoga.id,
    }).fetch();

    const classPass = await ClassPass.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      class_pass_type: fixtures.classPassTypeYogaTenClasses.id,
      classes_left: 5,
    }).fetch();

    const signup = await ClassSignup.create({
      client: testClientId,
      class: classObj.id,
      user: fixtures.userAlice.id,
      used_class_pass: classPass.id,
      class_pass_seat_spent: 1,
    }).fetch();

    await Promise.all([
      sails.helpers.classPass.applyNoShowFeeTypeFixedCount.with({
        signup,
        reason: 'late_cancel',
      }),
      sails.helpers.classPass.applyNoShowFeeTypeFixedCount.with({
        signup,
        reason: 'late_cancel',
      }),
    ]);

    const updatedSignup = await ClassSignup.findOne(signup.id);

    expect(updatedSignup).to.matchPattern(`{
      client: ${testClientId},
      class: ${classObj.id},
      user: ${fixtures.userAlice.id},
      used_class_pass: ${classPass.id},
      no_show_fee_applied: true,
      ...
    }`);

    const createdFee = await NoShowFee.find({class_signup_id: signup.id});

    expect(createdFee).to.matchPattern(`[
      {
        client_id: ${testClientId},
        class_id: ${classObj.id},
        user_id: ${fixtures.userAlice.id},
        classes_spent: 1,
        class_signup_id: ${signup.id},
        reason: 'late_cancel',
        cancelled_at: 0,
        ...
      }
    ]`);

    const [logEntry] = await ClassPassLog.find({class_pass_id: classPass.id});

    expect(logEntry).to.matchPattern(`
      {
        client_id: ${testClientId},
        user_id: ${fixtures.userAlice.id},
        class_pass_id: ${classPass.id},
        entry: 'Fee added for late cancellation of Yoga, Friday, May 15, 2020 10:00, meaning the class will not be refunded to the class pass. Class pass now has 5 classes left.',
        ...
      }`,
    );

    expect(emailSendFake.callCount).to.equal(1);
    expect(emailSendFake.getCall(0).args[0]).to.matchPattern({
      user: fixtures.userAlice.id,
      subject: 'Late cancellation fee applied',
      text: 'Dear Alice,\n\nYou have cancelled your registration for Yoga, Friday, May 15, 2020 10:00 after the cancellation deadline. Your class will not be refunded to your class pass.\n\nKind regards,\nTest client',
      emailType: 'email_late_cancel_fee_applied_fixed_count_class_pass',
    });

    await NoShowFee.destroy({id: createdFee.id});
    await ClassPassLog.destroy({id: logEntry.id});
    await Class.destroy({id: classObj.id});
    await ClassSignup.destroy({id: signup.id});
    await ClassPass.destroy({id: classPass.id});

  });

  it('should not send email if client has chosen not to', async () => {

    await ClientSettings.destroy({id: clientSettingsRowSendEmail.id});

    const classObj = await Class.create({
      client: testClientId,
      date: '2020-05-15',
      start_time: '10:00:00',
      end_time: '12:00:00',
      class_type: fixtures.classTypeYoga.id,
    }).fetch();

    const classPass = await ClassPass.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      class_pass_type: fixtures.classPassTypeYogaTenClasses.id,
      classes_left: 5,
    }).fetch();

    const signup = await ClassSignup.create({
      client: testClientId,
      class: classObj.id,
      user: fixtures.userAlice.id,
      used_class_pass: classPass.id,
      class_pass_seat_spent: 1,
    }).fetch();

    await sails.helpers.classPass.applyNoShowFeeTypeFixedCount.with({
      signup,
      reason: 'late_cancel',
    });

    const updatedSignup = await ClassSignup.findOne(signup.id);

    expect(updatedSignup).to.matchPattern(`{            
      no_show_fee_applied: true,
      ...
    }`);

    const createdFee = await NoShowFee.find({class_signup_id: signup.id});

    expect(createdFee).to.matchPattern(`[
      {        
        classes_spent: 1,       
        reason: 'late_cancel',
        cancelled_at: 0,
        ...
      }
    ]`);

    const [logEntry] = await ClassPassLog.find({class_pass_id: classPass.id});

    expect(logEntry).to.matchPattern(`
      {        
        entry: 'Fee added for late cancellation of Yoga, Friday, May 15, 2020 10:00, meaning the class will not be refunded to the class pass. Class pass now has 5 classes left.',
        ...
      }`,
    );

    expect(emailSendFake.callCount).to.equal(0);

    await NoShowFee.destroy({id: createdFee.id});
    await ClassPassLog.destroy({id: logEntry.id});
    await Class.destroy({id: classObj.id});
    await ClassSignup.destroy({id: signup.id});
    await ClassPass.destroy({id: classPass.id});

  });


});
