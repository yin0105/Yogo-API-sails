const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID;
const fixtures = require('../../../fixtures/factory').fixtures;
const emailSendFakeFactory = require('../../../fakes/email-send-fake-factory');
const sinon = require('sinon');

describe('helpers.memberships.apply-no-show-fee', async function () {

  let emailSendFake,
    clientSettingsRowSendEmail;

  beforeEach(async () => {
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

    const membership = await Membership.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      status: 'active',
    }).fetch();

    const signup = await ClassSignup.create({
      client: testClientId,
      class: classObj.id,
      user: fixtures.userAlice.id,
      used_membership: membership.id,
    }).fetch();

    await sails.helpers.memberships.applyNoShowFee.with({
      signup,
      no_show_fee_cancelled: false,
      reason: 'no_show',
    });

    const updatedSignup = await ClassSignup.findOne(signup.id);

    expect(updatedSignup).to.matchPattern(`{
      client: ${testClientId},
      class: ${classObj.id},
      user: ${fixtures.userAlice.id},
      used_membership: ${membership.id},
      no_show_fee_applied: true,
      ...
    }`);

    const createdFee = await NoShowFee.find({class_signup_id: signup.id});

    expect(createdFee).to.matchPattern(`[
      {
        client_id: ${testClientId},
        class_id: ${classObj.id},
        user_id: ${fixtures.userAlice.id},
        amount: 30,
        class_signup_id: ${signup.id},
        reason: 'no_show',
        cancelled_at: 0,
        ...
      }
    ]`);

    const [logEntry] = await MembershipLog.find({membership: membership.id});

    expect(logEntry).to.matchPattern(`
      {
        client: ${testClientId},
        user: ${fixtures.userAlice.id},
        membership: ${membership.id},
        entry: 'A fee of 30 kr has been added for non-attendance at Yoga, Friday, May 15, 2020 10:00.',
        ...
      }`,
    );

    expect(emailSendFake.callCount).to.equal(1);
    expect(emailSendFake.getCall(0).args[0]).to.matchPattern({
      user: fixtures.userAlice.id,
      subject: 'No-show fee applied',
      text: 'Dear Alice,\n\nBecause you did not attend Yoga, Friday, May 15, 2020 10:00, we have applied a fee of 30 kr to your membership.\n\nThe fee will be charged with you next automatic payment.\n\nKind regards,\nTest client',
      emailType: 'email_no_show_fee_applied_membership',
    });

    await NoShowFee.destroy({id: createdFee.id});
    await MembershipLog.destroy({id: logEntry.id});
    await Class.destroy({id: classObj.id});
    await ClassSignup.destroy({id: signup.id});

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

    const membership = await Membership.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      status: 'active',
    }).fetch();

    const signup = await ClassSignup.create({
      client: testClientId,
      class: classObj.id,
      user: fixtures.userAlice.id,
      used_membership: membership.id,
    }).fetch();

    await sails.helpers.memberships.applyNoShowFee.with({
      signup,
      no_show_fee_cancelled: false,
      reason: 'no_show',
    });

    const updatedSignup = await ClassSignup.findOne(signup.id);

    expect(updatedSignup).to.matchPattern(`{
      client: ${testClientId},
      class: ${classObj.id},
      user: ${fixtures.userAlice.id},
      used_membership: ${membership.id},
      no_show_fee_applied: true,
      ...
    }`);

    const createdFee = await NoShowFee.find({class_signup_id: signup.id});

    expect(createdFee).to.matchPattern(`[
      {
        client_id: ${testClientId},
        class_id: ${classObj.id},
        user_id: ${fixtures.userAlice.id},
        amount: 30,
        class_signup_id: ${signup.id},
        reason: 'no_show',
        cancelled_at: 0,
        ...
      }
    ]`);

    const [logEntry] = await MembershipLog.find({membership: membership.id});

    expect(logEntry).to.matchPattern(`
      {
        client: ${testClientId},
        user: ${fixtures.userAlice.id},
        membership: ${membership.id},
        entry: 'Gebyr på 30 kr pålagt for manglende fremmøde til Yoga, fredag d. 15. maj 2020 10:00.',
        ...
      }`,
    );

    expect(emailSendFake.callCount).to.equal(1);
    expect(emailSendFake.getCall(0).args[0]).to.matchPattern({
      user: fixtures.userAlice.id,
      subject: 'Gebyr for manglende fremmøde pålagt',
      text: 'Kære Alice\n\nDa du er udeblevet fra Yoga, fredag d. 15. maj 2020 kl. 10:00, har vi pålagt et gebyr på 30 kr kr på dit medlemskab.\n\nGebyret vil blive trukket sammen med den næste automatiske betaling.\n\nMed venlig hilsen\nTest client',
      emailType: 'email_no_show_fee_applied_membership',
    });


    await NoShowFee.destroy({id: createdFee.id});
    await MembershipLog.destroy({id: logEntry.id});
    await Class.destroy({id: classObj.id});
    await ClassSignup.destroy({id: signup.id});

    sails.yogo.locale = oldLocale;
    await ClientSettings.destroy({id: clientSettingsRow.id});

  });

  it('should apply a non-activated fee (and with another reason)', async () => {

    const classObj = await Class.create({
      client: testClientId,
      date: '2020-05-15',
      start_time: '10:00:00',
      end_time: '12:00:00',
      class_type: fixtures.classTypeYoga.id,
    }).fetch();

    const membership = await Membership.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      status: 'active',
    }).fetch();

    const signup = await ClassSignup.create({
      client: testClientId,
      class: classObj.id,
      user: fixtures.userAlice.id,
      used_membership: membership.id,
    }).fetch();

    const timestampBeforeCall = Date.now();
    await sails.helpers.memberships.applyNoShowFee.with({
      signup,
      no_show_fee_cancelled: true,
      reason: 'late_cancel',
    });
    const timestampAfterCall = Date.now();

    const updatedSignup = await ClassSignup.findOne(signup.id);

    expect(updatedSignup).to.matchPattern(`{
      client: ${testClientId},
      class: ${classObj.id},
      user: ${fixtures.userAlice.id},
      used_membership: ${membership.id},
      no_show_fee_applied: true,
      ...
    }`);

    const createdFee = await NoShowFee.find({class_signup_id: signup.id});

    expect(createdFee).to.matchPattern(`[
      {
        client_id: ${testClientId},
        class_id: ${classObj.id},
        user_id: ${fixtures.userAlice.id},
        amount: 30,
        class_signup_id: ${signup.id},
        reason: 'late_cancel',
        cancelled_at: _.isBetween|${timestampBeforeCall - 1}|${timestampAfterCall + 1},
        ...
      }
    ]`);

    const [logEntry] = await MembershipLog.find({membership: membership.id});

    expect(logEntry).to.matchPattern(`
      {
        client: ${testClientId},
        user: ${fixtures.userAlice.id},
        membership: ${membership.id},
        entry: 'A fee of 30 kr has been added for late cancellation of Yoga, Friday, May 15, 2020 10:00 (pending review).',
        ...
      }`,
    );

    await NoShowFee.destroy({id: createdFee.id});
    await MembershipLog.destroy({id: logEntry.id});
    await Class.destroy({id: classObj.id});
    await ClassSignup.destroy({id: signup.id});

  });

  it('should apply a non-activated fee and create a log entry in Danish', async () => {

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

    const membership = await Membership.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      status: 'active',
    }).fetch();

    const signup = await ClassSignup.create({
      client: testClientId,
      class: classObj.id,
      user: fixtures.userAlice.id,
      used_membership: membership.id,
    }).fetch();

    const timestampBeforeCall = Date.now();
    await sails.helpers.memberships.applyNoShowFee.with({
      signup,
      no_show_fee_cancelled: true,
      reason: 'late_cancel',
    });
    const timestampAfterCall = Date.now();

    const updatedSignup = await ClassSignup.findOne(signup.id);

    expect(updatedSignup).to.matchPattern(`{
      client: ${testClientId},
      class: ${classObj.id},
      user: ${fixtures.userAlice.id},
      used_membership: ${membership.id},
      no_show_fee_applied: true,
      ...
    }`);

    const createdFee = await NoShowFee.find({class_signup_id: signup.id});

    expect(createdFee).to.matchPattern(`[
      {
        client_id: ${testClientId},
        class_id: ${classObj.id},
        user_id: ${fixtures.userAlice.id},
        amount: 30,
        class_signup_id: ${signup.id},
        reason: 'late_cancel',
        cancelled_at: _.isBetween|${timestampBeforeCall - 1}|${timestampAfterCall + 1},
        ...
      }
    ]`);

    const [logEntry] = await MembershipLog.find({membership: membership.id});

    expect(logEntry).to.matchPattern(`
      {
        client: ${testClientId},
        user: ${fixtures.userAlice.id},
        membership: ${membership.id},
        entry: 'Gebyr på 30 kr pålagt for sen afmelding til Yoga, fredag d. 15. maj 2020 10:00 (afventer godkendelse).',
        ...
      }`,
    );

    await NoShowFee.destroy({id: createdFee.id});
    await MembershipLog.destroy({id: logEntry.id});
    await Class.destroy({id: classObj.id});
    await ClassSignup.destroy({id: signup.id});

    sails.yogo.locale = oldLocale;
    await ClientSettings.destroy({id: clientSettingsRow.id});

  });

  it('should only apply fee once on two simultaneous requests', async () => {

    const classObj = await Class.create({
      client: testClientId,
      date: '2020-05-15',
      start_time: '10:00:00',
      end_time: '12:00:00',
      class_type: fixtures.classTypeYoga.id,
    }).fetch();

    const membership = await Membership.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      status: 'active',
    }).fetch();

    const signup = await ClassSignup.create({
      client: testClientId,
      class: classObj.id,
      user: fixtures.userAlice.id,
      used_membership: membership.id,
    }).fetch();

    await Promise.all([
      sails.helpers.memberships.applyNoShowFee.with({
        signup,
        no_show_fee_cancelled: false,
        reason: 'late_cancel',
      }),
      sails.helpers.memberships.applyNoShowFee.with({
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
      used_membership: ${membership.id},
      no_show_fee_applied: true,
      ...
    }`);

    const createdFee = await NoShowFee.find({class_signup_id: signup.id});

    expect(createdFee).to.matchPattern(`[
      {
        client_id: ${testClientId},
        class_id: ${classObj.id},
        user_id: ${fixtures.userAlice.id},
        amount: 30,
        class_signup_id: ${signup.id},
        reason: 'late_cancel',
        cancelled_at: 0,
        ...
      }
    ]`);

    const [logEntry] = await MembershipLog.find({membership: membership.id});

    expect(logEntry).to.matchPattern(`
      {
        client: ${testClientId},
        user: ${fixtures.userAlice.id},
        membership: ${membership.id},
        entry: 'A fee of 30 kr has been added for late cancellation of Yoga, Friday, May 15, 2020 10:00.',
        ...
      }`,
    );

    expect(emailSendFake.callCount).to.equal(1);
    expect(emailSendFake.getCall(0).args[0]).to.matchPattern({
      user: fixtures.userAlice.id,
      subject: 'Late cancellation fee applied',
      text: 'Dear Alice,\n\nDue to late cancellation of Yoga, Friday, May 15, 2020 10:00, we have applied a fee of 30 kr to your membership.\n\nThe fee will be charged with you next automatic payment.\n\nKind regards,\nTest client',
      emailType: 'email_late_cancel_fee_applied_membership',
    });

    await NoShowFee.destroy({id: createdFee.id});
    await MembershipLog.destroy({id: logEntry.id});
    await Class.destroy({id: classObj.id});
    await ClassSignup.destroy({id: signup.id});

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

    const membership = await Membership.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      status: 'active',
    }).fetch();

    const signup = await ClassSignup.create({
      client: testClientId,
      class: classObj.id,
      user: fixtures.userAlice.id,
      used_membership: membership.id,
    }).fetch();

    await sails.helpers.memberships.applyNoShowFee.with({
      signup,
      no_show_fee_cancelled: false,
      reason: 'no_show',
    });

    const updatedSignup = await ClassSignup.findOne(signup.id);

    expect(updatedSignup).to.matchPattern(`{      
      no_show_fee_applied: true,
      ...
    }`);

    const createdFee = await NoShowFee.find({class_signup_id: signup.id});

    expect(createdFee).to.matchPattern(`[
      {        
        amount: 30,        
        reason: 'no_show',
        cancelled_at: 0,
        ...
      }
    ]`);

    const [logEntry] = await MembershipLog.find({membership: membership.id});

    expect(logEntry).to.matchPattern(`
      {        
        entry: 'A fee of 30 kr has been added for non-attendance at Yoga, Friday, May 15, 2020 10:00.',
        ...
      }`,
    );

    expect(emailSendFake.callCount).to.equal(0);

    await NoShowFee.destroy({id: createdFee.id});
    await MembershipLog.destroy({id: logEntry.id});
    await Class.destroy({id: classObj.id});
    await ClassSignup.destroy({id: signup.id});

  });

  it('should apply the same fee for late cancellation', async () => {

    const classObj = await Class.create({
      client: testClientId,
      date: '2020-05-15',
      start_time: '10:00:00',
      end_time: '12:00:00',
      class_type: fixtures.classTypeYoga.id,
    }).fetch();

    const membership = await Membership.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      status: 'active',
    }).fetch();

    const signup = await ClassSignup.create({
      client: testClientId,
      class: classObj.id,
      user: fixtures.userAlice.id,
      used_membership: membership.id,
    }).fetch();

    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'no_show_membership_fee_amount',
      value: 100,
    }).fetch();

    await sails.helpers.memberships.applyNoShowFee.with({
      signup,
      no_show_fee_cancelled: false,
      reason: 'late_cancel',
    });

    const updatedSignup = await ClassSignup.findOne(signup.id);

    expect(updatedSignup).to.matchPattern(`{
      client: ${testClientId},
      class: ${classObj.id},
      user: ${fixtures.userAlice.id},
      used_membership: ${membership.id},
      no_show_fee_applied: true,
      ...
    }`);

    const createdFee = await NoShowFee.find({class_signup_id: signup.id});

    expect(createdFee).to.matchPattern(`[
      {
        client_id: ${testClientId},
        class_id: ${classObj.id},
        user_id: ${fixtures.userAlice.id},
        amount: 100,
        class_signup_id: ${signup.id},
        reason: 'late_cancel',
        cancelled_at: 0,
        ...
      }
    ]`);

    const [logEntry] = await MembershipLog.find({membership: membership.id});

    expect(logEntry).to.matchPattern(`
      {
        client: ${testClientId},
        user: ${fixtures.userAlice.id},
        membership: ${membership.id},
        entry: 'A fee of 100 kr has been added for late cancellation of Yoga, Friday, May 15, 2020 10:00.',
        ...
      }`,
    );

    expect(emailSendFake.callCount).to.equal(1);
    expect(emailSendFake.getCall(0).args[0]).to.matchPattern({
      user: fixtures.userAlice.id,
      subject: 'Late cancellation fee applied',
      text: 'Dear Alice,\n\nDue to late cancellation of Yoga, Friday, May 15, 2020 10:00, we have applied a fee of 100 kr to your membership.\n\nThe fee will be charged with you next automatic payment.\n\nKind regards,\nTest client',
      emailType: 'email_late_cancel_fee_applied_membership',
    });

    await NoShowFee.destroy({id: createdFee.id});
    await MembershipLog.destroy({id: logEntry.id});
    await Class.destroy({id: classObj.id});
    await ClassSignup.destroy({id: signup.id});
    await ClientSettings.destroy({id: clientSettingsRow.id});

  });

  it('should apply a different fee for late cancellation', async () => {

    const classObj = await Class.create({
      client: testClientId,
      date: '2020-05-15',
      start_time: '10:00:00',
      end_time: '12:00:00',
      class_type: fixtures.classTypeYoga.id,
    }).fetch();

    const membership = await Membership.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      status: 'active',
    }).fetch();

    const signup = await ClassSignup.create({
      client: testClientId,
      class: classObj.id,
      user: fixtures.userAlice.id,
      used_membership: membership.id,
    }).fetch();

    const clientSettingsRows = await ClientSettings.createEach([
      {
        client: testClientId,
        key: 'no_show_fees_and_late_cancel_fees_are_different',
        value: 1,
      },
      {
        client: testClientId,
        key: 'late_cancel_membership_fee_amount',
        value: 15,
      }]).fetch();

    await sails.helpers.memberships.applyNoShowFee.with({
      signup,
      no_show_fee_cancelled: false,
      reason: 'late_cancel',
    });

    const updatedSignup = await ClassSignup.findOne(signup.id);

    expect(updatedSignup).to.matchPattern(`{
      client: ${testClientId},
      class: ${classObj.id},
      user: ${fixtures.userAlice.id},
      used_membership: ${membership.id},
      no_show_fee_applied: true,
      ...
    }`);

    const createdFee = await NoShowFee.find({class_signup_id: signup.id});

    expect(createdFee).to.matchPattern(`[
      {
        client_id: ${testClientId},
        class_id: ${classObj.id},
        user_id: ${fixtures.userAlice.id},
        amount: 15,
        class_signup_id: ${signup.id},
        reason: 'late_cancel',
        cancelled_at: 0,
        ...
      }
    ]`);

    const [logEntry] = await MembershipLog.find({membership: membership.id});

    expect(logEntry).to.matchPattern(`
      {
        client: ${testClientId},
        user: ${fixtures.userAlice.id},
        membership: ${membership.id},
        entry: 'A fee of 15 kr has been added for late cancellation of Yoga, Friday, May 15, 2020 10:00.',
        ...
      }`,
    );

    expect(emailSendFake.callCount).to.equal(1);
    expect(emailSendFake.getCall(0).args[0]).to.matchPattern({
      user: fixtures.userAlice.id,
      subject: 'Late cancellation fee applied',
      text: 'Dear Alice,\n\nDue to late cancellation of Yoga, Friday, May 15, 2020 10:00, we have applied a fee of 15 kr to your membership.\n\nThe fee will be charged with you next automatic payment.\n\nKind regards,\nTest client',
      emailType: 'email_late_cancel_fee_applied_membership',
    });

    await NoShowFee.destroy({id: createdFee.id});
    await MembershipLog.destroy({id: logEntry.id});
    await Class.destroy({id: classObj.id});
    await ClassSignup.destroy({id: signup.id});
    await ClientSettings.destroy({id: _.map(clientSettingsRows, 'id')});

  });

});
