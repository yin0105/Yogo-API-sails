const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID;
const fixtures = require('../../../fixtures/factory').fixtures;
const emailSendFakeFactory = require('../../../fakes/email-send-fake-factory');
const sinon = require('sinon');

describe('helpers.class-pass.apply-no-show-fee-type-unlimited', async function () {

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

  it('should apply a fee to a class signup', async () => {

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
      class_pass_type: fixtures.classPassTypeYogaUnlimitedOneMonth.id,
      valid_until: '2020-05-20',
    }).fetch();

    const signup = await ClassSignup.create({
      client: testClientId,
      class: classObj.id,
      user: fixtures.userAlice.id,
      used_class_pass: classPass.id,
    }).fetch();

    await sails.helpers.classPass.applyNoShowFeeTypeUnlimited.with({
      signup,
      no_show_fee_cancelled: false,
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
        days_deducted: 1,
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
        entry: '1 day charged from class pass for non-attendance at Yoga, Friday, May 15, 2020 10:00. Class pass is now valid until Tuesday, May 19, 2020.',
        ...
      }`,
    );

    expect(emailSendFake.callCount).to.equal(1);
    expect(emailSendFake.getCall(0).args[0]).to.matchPattern({
      user: fixtures.userAlice.id,
      subject: 'No-show fee applied',
      text: 'Dear Alice,\n\nBecause you did not attend Yoga, Friday, May 15, 2020 10:00, we have charged a fee of 1 day from your class pass.\n\nKind regards,\nTest client',
      emailType: 'email_no_show_fee_applied_time_based_class_pass',
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
      class_pass_type: fixtures.classPassTypeYogaUnlimitedOneMonth.id,
      valid_until: '2020-05-20',
    }).fetch();

    const signup = await ClassSignup.create({
      client: testClientId,
      class: classObj.id,
      user: fixtures.userAlice.id,
      used_class_pass: classPass.id,
    }).fetch();

    await sails.helpers.classPass.applyNoShowFeeTypeUnlimited.with({
      signup,
      no_show_fee_cancelled: false,
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
        days_deducted: 1,
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
        entry: '1 dag trukket fra kortets løbetid pga manglende fremmøde til Yoga, fredag d. 15. maj 2020 10:00. Kortet er nu gyldigt t.o.m. tirsdag d. 19. maj 2020.',
        ...
      }`,
    );

    expect(emailSendFake.callCount).to.equal(1);
    expect(emailSendFake.getCall(0).args[0]).to.matchPattern({
      user: fixtures.userAlice.id,
      subject: 'Gebyr for manglende fremmøde pålagt',
      text: 'Kære Alice\n\nDa du er udeblevet fra Yoga, fredag d. 15. maj 2020 kl. 10:00, har vi trukket 1 dag fra udløbsdatoen på dit adgangskort.\n\nMed venlig hilsen\nTest client',
      emailType: 'email_no_show_fee_applied_time_based_class_pass',
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

  it('should apply a non-activated fee', async () => {

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
      class_pass_type: fixtures.classPassTypeYogaUnlimitedOneMonth.id,
      valid_until: '2020-05-20',
    }).fetch();

    const signup = await ClassSignup.create({
      client: testClientId,
      class: classObj.id,
      user: fixtures.userAlice.id,
      used_class_pass: classPass.id,
    }).fetch();

    const timestampBeforeCall = Date.now();
    await sails.helpers.classPass.applyNoShowFeeTypeUnlimited.with({
      signup,
      no_show_fee_cancelled: true,
      reason: 'no_show',
    });
    const timestampAfterCall = Date.now() + 1;


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
        days_deducted: 1,
        class_signup_id: ${signup.id},
        reason: 'no_show',
        cancelled_at: _.isBetween|${timestampBeforeCall - 1}|${timestampAfterCall},
        ...
      }
    ]`);

    const [logEntry] = await ClassPassLog.find({class_pass_id: classPass.id});

    expect(logEntry).to.matchPattern(`
      {
        client_id: ${testClientId},
        user_id: ${fixtures.userAlice.id},
        class_pass_id: ${classPass.id},
        entry: '1 day charged from class pass for non-attendance at Yoga, Friday, May 15, 2020 10:00 (pending review).',
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

  it('should apply a non-activated fee and create a Danish log entry', async () => {

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
      class_pass_type: fixtures.classPassTypeYogaUnlimitedOneMonth.id,
      valid_until: '2020-05-20',
    }).fetch();

    const signup = await ClassSignup.create({
      client: testClientId,
      class: classObj.id,
      user: fixtures.userAlice.id,
      used_class_pass: classPass.id,
    }).fetch();

    const timestampBeforeCall = Date.now();
    await sails.helpers.classPass.applyNoShowFeeTypeUnlimited.with({
      signup,
      no_show_fee_cancelled: true,
      reason: 'no_show',
    });
    const timestampAfterCall = Date.now() + 1;


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
        days_deducted: 1,
        class_signup_id: ${signup.id},
        reason: 'no_show',
        cancelled_at: _.isBetween|${timestampBeforeCall - 1}|${timestampAfterCall},
        ...
      }
    ]`);

    const [logEntry] = await ClassPassLog.find({class_pass_id: classPass.id});

    expect(logEntry).to.matchPattern(`
      {
        client_id: ${testClientId},
        user_id: ${fixtures.userAlice.id},
        class_pass_id: ${classPass.id},
        entry: '1 dag trukket fra kortets løbetid pga manglende fremmøde til Yoga, fredag d. 15. maj 2020 10:00 (afventer godkendelse).',
        ...
      }`,
    );

    expect(emailSendFake.callCount).to.equal(0);

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
      class_pass_type: fixtures.classPassTypeYogaUnlimitedOneMonth.id,
      valid_until: '2020-05-20',
    }).fetch();

    const signup = await ClassSignup.create({
      client: testClientId,
      class: classObj.id,
      user: fixtures.userAlice.id,
      used_class_pass: classPass.id,
      class_pass_seat_spent: 1,
    }).fetch();

    await Promise.all([
      sails.helpers.classPass.applyNoShowFeeTypeUnlimited.with({
        signup,
        no_show_fee_cancelled: false,
        reason: 'late_cancel',
      }),
      sails.helpers.classPass.applyNoShowFeeTypeUnlimited.with({
        signup,
        no_show_fee_cancelled: false,
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
        days_deducted: 1,
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
        entry: '1 day charged from class pass for late cancellation of Yoga, Friday, May 15, 2020 10:00. Class pass is now valid until Tuesday, May 19, 2020.',
        ...
      }`,
    );

    expect(emailSendFake.callCount).to.equal(1);
    expect(emailSendFake.getCall(0).args[0]).to.matchPattern({
      user: fixtures.userAlice.id,
      subject: 'Late cancellation fee applied',
      text: 'Dear Alice,\n\nDue to late cancellation of Yoga, Friday, May 15, 2020 10:00, we have charged a fee of 1 day from your class pass.\n\nKind regards,\nTest client',
      emailType: 'email_late_cancel_fee_applied_time_based_class_pass',
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
      class_pass_type: fixtures.classPassTypeYogaUnlimitedOneMonth.id,
      valid_until: '2020-05-20',
    }).fetch();

    const signup = await ClassSignup.create({
      client: testClientId,
      class: classObj.id,
      user: fixtures.userAlice.id,
      used_class_pass: classPass.id,
    }).fetch();

    await sails.helpers.classPass.applyNoShowFeeTypeUnlimited.with({
      signup,
      no_show_fee_cancelled: false,
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
        days_deducted: 1,       
        reason: 'no_show',
        cancelled_at: 0,
        ...
      }
    ]`);

    const [logEntry] = await ClassPassLog.find({class_pass_id: classPass.id});

    expect(logEntry).to.matchPattern(`
      {        
        entry: '1 day charged from class pass for non-attendance at Yoga, Friday, May 15, 2020 10:00. Class pass is now valid until Tuesday, May 19, 2020.',
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

  it('should apply same fee for late cancel', async () => {

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
      class_pass_type: fixtures.classPassTypeYogaUnlimitedOneMonth.id,
      valid_until: '2020-05-20',
    }).fetch();

    const signup = await ClassSignup.create({
      client: testClientId,
      class: classObj.id,
      user: fixtures.userAlice.id,
      used_class_pass: classPass.id,
    }).fetch();

    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'no_show_time_based_class_pass_deduct_number_of_days',
      value: 2
    }).fetch();

    await sails.helpers.classPass.applyNoShowFeeTypeUnlimited.with({
      signup,
      no_show_fee_cancelled: false,
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
        days_deducted: 2,
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
        entry: '2 days charged from class pass for late cancellation of Yoga, Friday, May 15, 2020 10:00. Class pass is now valid until Monday, May 18, 2020.',
        ...
      }`,
    );

    expect(emailSendFake.callCount).to.equal(1);
    expect(emailSendFake.getCall(0).args[0]).to.matchPattern({
      user: fixtures.userAlice.id,
      subject: 'Late cancellation fee applied',
      text: 'Dear Alice,\n\nDue to late cancellation of Yoga, Friday, May 15, 2020 10:00, we have charged a fee of 2 days from your class pass.\n\nKind regards,\nTest client',
      emailType: 'email_late_cancel_fee_applied_time_based_class_pass',
    });

    await NoShowFee.destroy({id: createdFee.id});
    await ClassPassLog.destroy({id: logEntry.id});
    await Class.destroy({id: classObj.id});
    await ClassSignup.destroy({id: signup.id});
    await ClassPass.destroy({id: classPass.id});
    await ClientSettings.destroy({id: clientSettingsRow.id});

  });

  it('should apply different fee for late cancel', async () => {

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
      class_pass_type: fixtures.classPassTypeYogaUnlimitedOneMonth.id,
      valid_until: '2020-05-20',
    }).fetch();

    const signup = await ClassSignup.create({
      client: testClientId,
      class: classObj.id,
      user: fixtures.userAlice.id,
      used_class_pass: classPass.id,
    }).fetch();

    const clientSettingsRows = await ClientSettings.createEach([
      {
        client: testClientId,
        key: 'no_show_fees_and_late_cancel_fees_are_different',
        value: 1,
      },
      {
        client: testClientId,
        key: 'no_show_time_based_class_pass_deduct_number_of_days',
        value: 2,
      },
    ]).fetch();

    await sails.helpers.classPass.applyNoShowFeeTypeUnlimited.with({
      signup,
      no_show_fee_cancelled: false,
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
        days_deducted: 1,
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
        entry: '1 day charged from class pass for late cancellation of Yoga, Friday, May 15, 2020 10:00. Class pass is now valid until Tuesday, May 19, 2020.',
        ...
      }`,
    );

    expect(emailSendFake.callCount).to.equal(1);
    expect(emailSendFake.getCall(0).args[0]).to.matchPattern({
      user: fixtures.userAlice.id,
      subject: 'Late cancellation fee applied',
      text: 'Dear Alice,\n\nDue to late cancellation of Yoga, Friday, May 15, 2020 10:00, we have charged a fee of 1 day from your class pass.\n\nKind regards,\nTest client',
      emailType: 'email_late_cancel_fee_applied_time_based_class_pass',
    });

    await NoShowFee.destroy({id: createdFee.id});
    await ClassPassLog.destroy({id: logEntry.id});
    await Class.destroy({id: classObj.id});
    await ClassSignup.destroy({id: signup.id});
    await ClassPass.destroy({id: classPass.id});
    await ClientSettings.destroy({id: _.map(clientSettingsRows, 'id')});

  });

});
