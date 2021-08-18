const supertest = require('supertest');

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID;
const fixtures = require('../../../fixtures/factory').fixtures;

const {authorizeAdmin, authorizeUserAlice} = require('../../../utils/request-helpers');
const sinon = require('sinon');

const emailSendFakeFactory = require('../../../fakes/email-send-fake-factory');


describe('controllers.NoShowFees.reactivate', () => {

  let emailSendFake,
    classObj,
    clientSettingsRowSendEmail;

  before(async () => {
    classObj = await Class.create({
      client: testClientId,
      class_type: fixtures.classTypeYoga.id,
      date: '2020-05-15',
      start_time: '10:00:00',
      end_time: '12:00:00',
    }).fetch();
  });

  after(async () => {
    await Class.destroy({id: classObj.id});
  });

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

  it('should throw forbidden if user is not admin', async () => {

    await supertest(sails.hooks.http.app)
      .post(`/no-show-fees/1/reactivate?client=${testClientId}`)
      .use(authorizeUserAlice())
      .expect('Forbidden')
      .expect(403);

  });

  it('should reactivate a fee for a membership', async () => {

    const membership = await Membership.create({
      client: testClientId,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'active',
      user: fixtures.userAlice.id,
    }).fetch();

    const signup = await ClassSignup.create({
      client: testClientId,
      class: classObj.id,
      user: fixtures.userAlice.id,
      used_membership: membership.id,
      no_show_fee_applied: true,
    }).fetch();

    const fee = await NoShowFee.create({
      client_id: testClientId,
      user_id: fixtures.userAlice.id,
      class_id: classObj.id,
      class_signup_id: signup.id,
      membership_id: membership.id,
      reason: 'no_show',
      amount: 30,
      cancelled_at: Date.now(),
    }).fetch();

    await supertest(sails.hooks.http.app)
      .post(`/no-show-fees/${fee.id}/reactivate?client=${testClientId}`)
      .use(authorizeAdmin())
      .expect(200);

    const updatedFee = await NoShowFee.findOne(fee.id);

    expect(updatedFee).to.matchPattern(`{
      cancelled_at: 0,
      ... 
    }`);

    const logEntries = await MembershipLog.find({membership: membership.id});
    expect(logEntries).to.matchPattern(`[{
      entry: 'No-show fee of 30 kr activated for Yoga, Friday, May 15, 2020 10:00. User: Admin Adminson (ID ${fixtures.userAdmin.id}).',
      ...
    }]`);

    expect(emailSendFake.getCall(0).args[0]).to.matchPattern({
      user: fixtures.userAlice.id,
      subject: 'No-show fee applied',
      text: 'Dear Alice,\n\nBecause you did not attend Yoga, Friday, May 15, 2020 10:00, we have applied a fee of 30 kr to your membership.\n\nThe fee will be charged with you next automatic payment.\n\nKind regards,\nTest client',
      emailType: 'email_no_show_fee_applied_membership',
    });

    await Membership.destroy({id: membership.id});
    await ClassSignup.destroy({id: signup.id});
    await NoShowFee.destroy({id: fee.id});

  });

  it('should reactivate a fee for a membership with Danish log and email', async () => {

    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'locale',
      value: 'da',
    }).fetch();

    const membership = await Membership.create({
      client: testClientId,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'active',
      user: fixtures.userAlice.id,
    }).fetch();

    const signup = await ClassSignup.create({
      client: testClientId,
      class: classObj.id,
      user: fixtures.userAlice.id,
      used_membership: membership.id,
      no_show_fee_applied: true,
    }).fetch();

    const fee = await NoShowFee.create({
      client_id: testClientId,
      user_id: fixtures.userAlice.id,
      class_id: classObj.id,
      class_signup_id: signup.id,
      membership_id: membership.id,
      reason: 'no_show',
      amount: 30,
      cancelled_at: Date.now(),
    }).fetch();

    await supertest(sails.hooks.http.app)
      .post(`/no-show-fees/${fee.id}/reactivate?client=${testClientId}`)
      .use(authorizeAdmin())
      .expect(200);

    const updatedFee = await NoShowFee.findOne(fee.id);

    expect(updatedFee).to.matchPattern(`{
      cancelled_at: 0,
      ... 
    }`);

    const logEntries = await MembershipLog.find({membership: membership.id});
    expect(logEntries).to.matchPattern(`[{
      entry: 'Gebyr for manglende fremmøde på 30 kr aktiveret for Yoga, fredag d. 15. maj 2020 10:00. Bruger: Admin Adminson (ID ${fixtures.userAdmin.id}).',
      ...
    }]`);

    expect(emailSendFake.getCall(0).args[0]).to.matchPattern({
      user: fixtures.userAlice.id,
      subject: 'Gebyr for manglende fremmøde pålagt',
      text: 'Kære Alice\n\nDa du er udeblevet fra Yoga, fredag d. 15. maj 2020 kl. 10:00, har vi pålagt et gebyr på 30 kr kr på dit medlemskab.\n\nGebyret vil blive trukket sammen med den næste automatiske betaling.\n\nMed venlig hilsen\nTest client',
      emailType: 'email_no_show_fee_applied_membership',
    });

    await Membership.destroy({id: membership.id});
    await ClassSignup.destroy({id: signup.id});
    await NoShowFee.destroy({id: fee.id});
    await ClientSettings.destroy({id: clientSettingsRow.id});

  });

  it('should reactivate a fee for a fixed count class pass', async () => {

    const classPass = await ClassPass.create({
      client: testClientId,
      class_pass_type: fixtures.classPassTypeYogaTenClasses.id,
      valid_until: '2020-05-20',
      classes_left: 5,
      user: fixtures.userAlice.id,
    }).fetch();

    const signup = await ClassSignup.create({
      client: testClientId,
      class: classObj.id,
      user: fixtures.userAlice.id,
      used_class_pass: classPass.id,
      no_show_fee_applied: true,
    }).fetch();

    const fee = await NoShowFee.create({
      client_id: testClientId,
      user_id: fixtures.userAlice.id,
      class_id: classObj.id,
      class_signup_id: signup.id,
      class_pass_id: classPass.id,
      reason: 'no_show',
      amount: 30,
      cancelled_at: Date.now(),
    }).fetch();

    await supertest(sails.hooks.http.app)
      .post(`/no-show-fees/${fee.id}/reactivate?client=${testClientId}`)
      .use(authorizeAdmin())
      .expect(200);

    const updatedFee = await NoShowFee.findOne(fee.id);

    expect(updatedFee).to.matchPattern(`{
      cancelled_at: 0,
      ... 
    }`);

    const updatedClassPass = await ClassPass.findOne(classPass.id);
    expect(updatedClassPass).to.matchPattern(`{
      classes_left: 4,
      ...
    }`);

    const logEntries = await ClassPassLog.find({class_pass_id: classPass.id});
    expect(logEntries).to.matchPattern(`[{
      entry: 'No-show fee for Yoga, Friday, May 15, 2020 10:00 activated. Class charged from class pass. Class pass now has 4 classes left. User: Admin Adminson (ID ${fixtures.userAdmin.id}).',
      ...
    }]`);

    expect(emailSendFake.getCall(0).args[0]).to.matchPattern({
      user: fixtures.userAlice.id,
      subject: 'No-show fee applied',
      text: 'Dear Alice,\n\nYou did not attend Yoga, Friday, May 15, 2020 10:00. Your class will not be refunded to your class pass.\n\nKind regards,\nTest client',
      emailType: 'email_no_show_fee_applied_fixed_count_class_pass',
    });

    await ClassPass.destroy({id: classPass.id});
    await ClassSignup.destroy({id: signup.id});
    await NoShowFee.destroy({id: fee.id});

  });

  it('should reactivate a fee for a fixed count class pass with Danish log and email', async () => {

    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'locale',
      value: 'da',
    }).fetch();

    const classPass = await ClassPass.create({
      client: testClientId,
      class_pass_type: fixtures.classPassTypeYogaTenClasses.id,
      classes_left: 5,
      valid_until: '2020-05-20',
      user: fixtures.userAlice.id,
    }).fetch();

    const signup = await ClassSignup.create({
      client: testClientId,
      class: classObj.id,
      user: fixtures.userAlice.id,
      used_class_pass: classPass.id,
      no_show_fee_applied: true,
    }).fetch();

    const fee = await NoShowFee.create({
      client_id: testClientId,
      user_id: fixtures.userAlice.id,
      class_id: classObj.id,
      class_signup_id: signup.id,
      class_pass_id: classPass.id,
      reason: 'no_show',
      classes_spent: 1,
      cancelled_at: Date.now(),
    }).fetch();

    await supertest(sails.hooks.http.app)
      .post(`/no-show-fees/${fee.id}/reactivate?client=${testClientId}`)
      .use(authorizeAdmin())
      .expect(200);

    const updatedFee = await NoShowFee.findOne(fee.id);

    expect(updatedFee).to.matchPattern(`{
      cancelled_at: 0,
      ... 
    }`);

    const updatedClassPass = await ClassPass.findOne(classPass.id);
    expect(updatedClassPass).to.matchPattern(`{
      classes_left: 4,
      ...
    }`);

    const logEntries = await ClassPassLog.find({class_pass_id: classPass.id});
    expect(logEntries).to.matchPattern(`[{
      entry: 'Gebyr for manglende fremmøde aktiveret for Yoga, fredag d. 15. maj 2020 10:00. Klip trukket fra klippekortet. Der er nu 4 klip tilbage på kortet. Bruger: Admin Adminson (ID ${fixtures.userAdmin.id}).',
      ...
    }]`);

    expect(emailSendFake.getCall(0).args[0]).to.matchPattern({
      user: fixtures.userAlice.id,
      subject: 'Gebyr for manglende fremmøde pålagt',
      text: 'Kære Alice\n\nDu er udeblevet fra Yoga, fredag d. 15. maj 2020 kl. 10:00. Dit klip vil ikke blive refunderet.\n\nMed venlig hilsen\nTest client',
      emailType: 'email_no_show_fee_applied_fixed_count_class_pass',
    });

    await ClassPass.destroy({id: classPass.id});
    await ClassSignup.destroy({id: signup.id});
    await NoShowFee.destroy({id: fee.id});
    await ClientSettings.destroy({id: clientSettingsRow.id});

  });

  it('should reactivate a fee for a time-based class pass', async () => {

    const classPass = await ClassPass.create({
      client: testClientId,
      class_pass_type: fixtures.classPassTypeYogaUnlimitedOneMonth.id,
      valid_until: '2020-05-20',
      user: fixtures.userAlice.id,
    }).fetch();

    const signup = await ClassSignup.create({
      client: testClientId,
      class: classObj.id,
      user: fixtures.userAlice.id,
      used_class_pass: classPass.id,
      no_show_fee_applied: true,
    }).fetch();

    const fee = await NoShowFee.create({
      client_id: testClientId,
      user_id: fixtures.userAlice.id,
      class_id: classObj.id,
      class_signup_id: signup.id,
      class_pass_id: classPass.id,
      reason: 'no_show',
      days_deducted: 2,
      cancelled_at: Date.now(),
    }).fetch();

    await supertest(sails.hooks.http.app)
      .post(`/no-show-fees/${fee.id}/reactivate?client=${testClientId}`)
      .use(authorizeAdmin())
      .expect(200);

    const updatedFee = await NoShowFee.findOne(fee.id);

    expect(updatedFee).to.matchPattern(`{
      cancelled_at: 0,
      ... 
    }`);

    const updatedClassPass = (await ClassPass.findOne(classPass.id)).toJSON();
    expect(updatedClassPass).to.matchPattern(`{
      valid_until: '2020-05-18',
      ...
    }`);

    const logEntries = await ClassPassLog.find({class_pass_id: classPass.id});
    expect(logEntries).to.matchPattern(`[{
      entry: 'No-show fee of 2 days activated for Yoga, Friday, May 15, 2020 10:00. Now valid until Monday, May 18, 2020. User: Admin Adminson (ID ${fixtures.userAdmin.id}).',
      ...
    }]`);

    expect(emailSendFake.getCall(0).args[0]).to.matchPattern({
      user: fixtures.userAlice.id,
      subject: 'No-show fee applied',
      text: 'Dear Alice,\n\nBecause you did not attend Yoga, Friday, May 15, 2020 10:00, we have charged a fee of 2 days from your class pass.\n\nKind regards,\nTest client',
      emailType: 'email_no_show_fee_applied_time_based_class_pass',
    });

    await ClassPass.destroy({id: classPass.id});
    await ClassSignup.destroy({id: signup.id});
    await NoShowFee.destroy({id: fee.id});

  });

  it('should reactivate a fee for a time-based class pass with Danish log and email', async () => {

    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'locale',
      value: 'da',
    }).fetch();

    const classPass = await ClassPass.create({
      client: testClientId,
      class_pass_type: fixtures.classPassTypeYogaUnlimitedOneMonth.id,
      valid_until: '2020-05-20',
      user: fixtures.userAlice.id,
    }).fetch();

    const signup = await ClassSignup.create({
      client: testClientId,
      class: classObj.id,
      user: fixtures.userAlice.id,
      used_class_pass: classPass.id,
      no_show_fee_applied: true,
    }).fetch();

    const fee = await NoShowFee.create({
      client_id: testClientId,
      user_id: fixtures.userAlice.id,
      class_id: classObj.id,
      class_signup_id: signup.id,
      class_pass_id: classPass.id,
      reason: 'no_show',
      days_deducted: 2,
      cancelled_at: Date.now(),
    }).fetch();

    await supertest(sails.hooks.http.app)
      .post(`/no-show-fees/${fee.id}/reactivate?client=${testClientId}`)
      .use(authorizeAdmin())
      .expect(200);

    const updatedFee = await NoShowFee.findOne(fee.id);

    expect(updatedFee).to.matchPattern(`{
      cancelled_at: 0,
      ... 
    }`);

    const updatedClassPass = (await ClassPass.findOne(classPass.id)).toJSON();
    expect(updatedClassPass).to.matchPattern(`{
      valid_until: '2020-05-18',
      ...
    }`);

    const logEntries = await ClassPassLog.find({class_pass_id: classPass.id});
    expect(logEntries).to.matchPattern(`[{
      entry: 'Gebyr for manglende fremmøde (2 dage) aktiveret for Yoga, fredag d. 15. maj 2020 10:00. Nu gyldigt t.o.m. mandag d. 18. maj 2020. Bruger: Admin Adminson (ID ${fixtures.userAdmin.id}).',
      ...
    }]`);

    expect(emailSendFake.getCall(0).args[0]).to.matchPattern({
      user: fixtures.userAlice.id,
      subject: 'Gebyr for manglende fremmøde pålagt',
      text: 'Kære Alice\n\nDa du er udeblevet fra Yoga, fredag d. 15. maj 2020 kl. 10:00, har vi trukket 2 dage fra udløbsdatoen på dit adgangskort.\n\nMed venlig hilsen\nTest client',
      emailType: 'email_no_show_fee_applied_time_based_class_pass',
    });

    await ClassPass.destroy({id: classPass.id});
    await ClassSignup.destroy({id: signup.id});
    await NoShowFee.destroy({id: fee.id});
    await ClientSettings.destroy({id: clientSettingsRow.id});

  });

  it('should only reactivate once, even on two simultaneous requests', async () => {
    const membership = await Membership.create({
      client: testClientId,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'active',
      user: fixtures.userAlice.id,
    }).fetch();

    const signup = await ClassSignup.create({
      client: testClientId,
      class: classObj.id,
      user: fixtures.userAlice.id,
      used_membership: membership.id,
      no_show_fee_applied: true,
    }).fetch();

    const fee = await NoShowFee.create({
      client_id: testClientId,
      user_id: fixtures.userAlice.id,
      class_id: classObj.id,
      class_signup_id: signup.id,
      membership_id: membership.id,
      reason: 'no_show',
      amount: 30,
      cancelled_at: Date.now(),
    }).fetch();

    await Promise.all([
      supertest(sails.hooks.http.app)
        .post(`/no-show-fees/${fee.id}/reactivate?client=${testClientId}`)
        .use(authorizeAdmin())
        .expect(200),
      supertest(sails.hooks.http.app)
        .post(`/no-show-fees/${fee.id}/reactivate?client=${testClientId}`)
        .use(authorizeAdmin())
        .expect(200),
    ]);


    const updatedFee = await NoShowFee.findOne(fee.id);

    expect(updatedFee).to.matchPattern(`{
      cancelled_at: 0,
      ... 
    }`);

    const logEntries = await MembershipLog.find({membership: membership.id});
    expect(logEntries).to.matchPattern(`[{
      entry: 'No-show fee of 30 kr activated for Yoga, Friday, May 15, 2020 10:00. User: Admin Adminson (ID ${fixtures.userAdmin.id}).',
      ...
    }]`);

    expect(emailSendFake.callCount).to.equal(1);
    expect(emailSendFake.getCall(0).args[0]).to.matchPattern({
      user: fixtures.userAlice.id,
      subject: 'No-show fee applied',
      text: 'Dear Alice,\n\nBecause you did not attend Yoga, Friday, May 15, 2020 10:00, we have applied a fee of 30 kr to your membership.\n\nThe fee will be charged with you next automatic payment.\n\nKind regards,\nTest client',
      emailType: 'email_no_show_fee_applied_membership',
    });

    await Membership.destroy({id: membership.id});
    await ClassSignup.destroy({id: signup.id});
    await NoShowFee.destroy({id: fee.id});
  });

  it('should not send email if client has chosen not to', async () => {

    await ClientSettings.destroy({id: clientSettingsRowSendEmail.id});

    const membership = await Membership.create({
      client: testClientId,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'active',
      user: fixtures.userAlice.id,
    }).fetch();

    const signup = await ClassSignup.create({
      client: testClientId,
      class: classObj.id,
      user: fixtures.userAlice.id,
      used_membership: membership.id,
      no_show_fee_applied: true,
    }).fetch();

    const fee = await NoShowFee.create({
      client_id: testClientId,
      user_id: fixtures.userAlice.id,
      class_id: classObj.id,
      class_signup_id: signup.id,
      membership_id: membership.id,
      reason: 'no_show',
      amount: 30,
      cancelled_at: Date.now(),
    }).fetch();

    await supertest(sails.hooks.http.app)
        .post(`/no-show-fees/${fee.id}/reactivate?client=${testClientId}`)
        .use(authorizeAdmin())
        .expect(200);

    const updatedFee = await NoShowFee.findOne(fee.id);

    expect(updatedFee).to.matchPattern(`{
      cancelled_at: 0,
      ... 
    }`);

    const logEntries = await MembershipLog.find({membership: membership.id});
    expect(logEntries).to.matchPattern(`[{
      entry: 'No-show fee of 30 kr activated for Yoga, Friday, May 15, 2020 10:00. User: Admin Adminson (ID ${fixtures.userAdmin.id}).',
      ...
    }]`);

    expect(emailSendFake.callCount).to.equal(0);

    await Membership.destroy({id: membership.id});
    await ClassSignup.destroy({id: signup.id});
    await NoShowFee.destroy({id: fee.id});
  });

});
