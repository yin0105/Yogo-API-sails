const supertest = require('supertest');

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID;
const fixtures = require('../../../fixtures/factory').fixtures;

const {authorizeAdmin, authorizeUserAlice} = require('../../../utils/request-helpers');
const sinon = require('sinon');

const emailSendFakeFactory = require('../../../fakes/email-send-fake-factory');


describe('controllers.NoShowFees.cancel', () => {

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
      .post(`/no-show-fees/1/cancel?client=${testClientId}`)
      .use(authorizeUserAlice())
      .expect('Forbidden')
      .expect(403);

  });

  describe('should return error if fee is already paid', async () => {

    let feeAlreadyPaid;

    before(async () => {
      feeAlreadyPaid = await NoShowFee.create({
        client_id: testClientId,
        user_id: fixtures.userAlice.id,
        class_id: classObj.id,
        class_signup_id: 1,
        membership_id: 1,
        reason: 'no_show',
        amount: 30,
        paid_with_order_id: 1,
      }).fetch();

    });

    after(async () => {
      await NoShowFee.destroy({id: feeAlreadyPaid.id});
    });

    it('simple error format', async () => {
      const {text: errorResponse} = await supertest(sails.hooks.http.app)
        .post(`/no-show-fees/${feeAlreadyPaid.id}/cancel?client=${testClientId}`)
        .use(authorizeAdmin())
        .expect(200);

      expect(errorResponse).to.equal('E_NO_SHOW_FEE_ALREADY_PAID');
    });

    it('extended error format, English', async () => {

      const {body: extendedErrorResponse} = await supertest(sails.hooks.http.app)
        .post(`/no-show-fees/${feeAlreadyPaid.id}/cancel?client=${testClientId}`)
        .set('X-Yogo-Client-Accepts-Extended-Error-Format', 1)
        .use(authorizeAdmin())
        .expect(200);

      expect(extendedErrorResponse).to.matchPattern({
        error: {
          type: 'noShowFeeAlreadyPaid',
          localized_title: 'The fee has already been paid.',
          localized_message: 'The fee cannot be cancelled, as it has already been paid.',
        },
      });

    });

    it('extended error format, Danish', async () => {

      const clientSettingsRow = await ClientSettings.create({
        client: testClientId,
        key: 'locale',
        value: 'da',
      }).fetch();

      const {body: extendedErrorResponse} = await supertest(sails.hooks.http.app)
        .post(`/no-show-fees/${feeAlreadyPaid.id}/cancel?client=${testClientId}`)
        .set('X-Yogo-Client-Accepts-Extended-Error-Format', 1)
        .use(authorizeAdmin())
        .expect(200);

      expect(extendedErrorResponse).to.matchPattern({
        error: {
          type: 'noShowFeeAlreadyPaid',
          localized_title: 'Gebyret er allerede betalt.',
          localized_message: 'Gebyret kan ikke annulleres, da det allerede er betalt.',
        },
      });

      await ClientSettings.destroy({id: clientSettingsRow.id});

    });

  });

  it('should cancel a fee for a membership', async () => {

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
    }).fetch();

    const timestampBeforeCall = Date.now();

    await supertest(sails.hooks.http.app)
      .post(`/no-show-fees/${fee.id}/cancel?client=${testClientId}`)
      .use(authorizeAdmin())
      .expect(200);

    const timestampAfterCall = Date.now();

    const updatedFee = await NoShowFee.findOne(fee.id);

    expect(updatedFee).to.matchPattern(`{
      cancelled_at: _.isBetween|${timestampBeforeCall - 1}|${timestampAfterCall + 1},
      ... 
    }`);

    const logEntries = await MembershipLog.find({membership: membership.id});
    expect(logEntries).to.matchPattern(`[{
      entry: 'No-show fee of 30 kr cancelled for Yoga, Friday, May 15, 2020 10:00. User: Admin Adminson (ID ${fixtures.userAdmin.id}).',
      ...
    }]`);

    expect(emailSendFake.getCall(0).args[0]).to.matchPattern({
      user: fixtures.userAlice.id,
      subject: 'No-show fee cancelled',
      text: 'Dear Alice,\n\nYour fee of 30 kr for not attending Yoga, Friday, May 15, 2020 10:00, has been cancelled. The fee will not be charged.\n\nKind regards,\nTest client',
      emailType: 'email_no_show_fee_cancelled_membership',
    });

    await Membership.destroy({id: membership.id});
    await ClassSignup.destroy({id: signup.id});
    await NoShowFee.destroy({id: fee.id});

  });

  it('should cancel a fee for a membership with Danish log and email', async () => {

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
    }).fetch();

    const timestampBeforeCall = Date.now();

    await supertest(sails.hooks.http.app)
      .post(`/no-show-fees/${fee.id}/cancel?client=${testClientId}`)
      .use(authorizeAdmin())
      .expect(200);

    const timestampAfterCall = Date.now();

    const updatedFee = await NoShowFee.findOne(fee.id);

    expect(updatedFee).to.matchPattern(`{
      cancelled_at: _.isBetween|${timestampBeforeCall - 1}|${timestampAfterCall + 1},
      ... 
    }`);

    const logEntries = await MembershipLog.find({membership: membership.id});
    expect(logEntries).to.matchPattern(`[{
      entry: 'Gebyr for manglende fremmøde på 30 kr annulleret for Yoga, fredag d. 15. maj 2020 10:00. Bruger: Admin Adminson (ID ${fixtures.userAdmin.id}).',
      ...
    }]`);

    expect(emailSendFake.getCall(0).args[0]).to.matchPattern({
      user: fixtures.userAlice.id,
      subject: 'Gebyr for manglende fremmøde annulleret',
      text: 'Kære Alice\n\nDit gebyr på 30 kr for manglende fremmøde til Yoga, fredag d. 15. maj 2020 kl. 10:00, er blevet annulleret. Gebyret vil ikke blive trukket.\n\nMed venlig hilsen\nTest client',
      emailType: 'email_no_show_fee_cancelled_membership',
    });

    await Membership.destroy({id: membership.id});
    await ClassSignup.destroy({id: signup.id});
    await NoShowFee.destroy({id: fee.id});
    await ClientSettings.destroy({id: clientSettingsRow.id});

  });

  it('should cancel a fee for a fixed count class pass', async () => {

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
    }).fetch();

    const timestampBeforeCall = Date.now();

    await supertest(sails.hooks.http.app)
      .post(`/no-show-fees/${fee.id}/cancel?client=${testClientId}`)
      .use(authorizeAdmin())
      .expect(200);

    const timestampAfterCall = Date.now();

    const updatedFee = await NoShowFee.findOne(fee.id);

    expect(updatedFee).to.matchPattern(`{
      cancelled_at: _.isBetween|${timestampBeforeCall - 1}|${timestampAfterCall + 1},
      ... 
    }`);

    const updatedClassPass = await ClassPass.findOne(classPass.id);
    expect(updatedClassPass).to.matchPattern(`{
      classes_left: 6,
      ...
    }`);

    const logEntries = await ClassPassLog.find({class_pass_id: classPass.id});
    expect(logEntries).to.matchPattern(`[{
      entry: 'No-show fee cancelled for Yoga, Friday, May 15, 2020 10:00. Class returned to class pass. Class pass now has 6 classes left. User: Admin Adminson (ID ${fixtures.userAdmin.id}).',
      ...
    }]`);

    expect(emailSendFake.getCall(0).args[0]).to.matchPattern({
      user: fixtures.userAlice.id,
      subject: 'No-show fee cancelled',
      text: 'Dear Alice,\n\nYour fee for not attending Yoga, Friday, May 15, 2020 10:00 has been cancelled. Your class has been refunded to your class pass.\n\nKind regards,\nTest client',
      emailType: 'email_no_show_fee_cancelled_fixed_count_class_pass',
    });

    await ClassPass.destroy({id: classPass.id});
    await ClassSignup.destroy({id: signup.id});
    await NoShowFee.destroy({id: fee.id});

  });

  it('should cancel a fee for a fixed count class pass with Danish log and email', async () => {

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
    }).fetch();

    const timestampBeforeCall = Date.now();

    await supertest(sails.hooks.http.app)
      .post(`/no-show-fees/${fee.id}/cancel?client=${testClientId}`)
      .use(authorizeAdmin())
      .expect(200);

    const timestampAfterCall = Date.now();

    const updatedFee = await NoShowFee.findOne(fee.id);

    expect(updatedFee).to.matchPattern(`{
      cancelled_at: _.isBetween|${timestampBeforeCall - 1}|${timestampAfterCall + 1},
      ... 
    }`);

    const updatedClassPass = await ClassPass.findOne(classPass.id);
    expect(updatedClassPass).to.matchPattern(`{
      classes_left: 6,
      ...
    }`);

    const logEntries = await ClassPassLog.find({class_pass_id: classPass.id});
    expect(logEntries).to.matchPattern(`[{
      entry: 'Gebyr for manglende fremmøde annulleret for Yoga, fredag d. 15. maj 2020 10:00. Klip tilbageført til klippekortet. Der er nu 6 klip tilbage på kortet. Bruger: Admin Adminson (ID ${fixtures.userAdmin.id}).',
      ...
    }]`);

    expect(emailSendFake.getCall(0).args[0]).to.matchPattern({
      user: fixtures.userAlice.id,
      subject: 'Gebyr for manglende fremmøde annulleret',
      text: 'Kære Alice\n\nDit gebyr for manglende fremmøde til Yoga, fredag d. 15. maj 2020 kl. 10:00 er annulleret. Dit klip er blevet refunderet.\n\nMed venlig hilsen\nTest client',
      emailType: 'email_no_show_fee_cancelled_fixed_count_class_pass',
    });

    await ClassPass.destroy({id: classPass.id});
    await ClassSignup.destroy({id: signup.id});
    await NoShowFee.destroy({id: fee.id});
    await ClientSettings.destroy({id: clientSettingsRow.id});

  });

  it('should cancel a fee for a time-based class pass', async () => {

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
    }).fetch();

    const timestampBeforeCall = Date.now();

    await supertest(sails.hooks.http.app)
      .post(`/no-show-fees/${fee.id}/cancel?client=${testClientId}`)
      .use(authorizeAdmin())
      .expect(200);

    const timestampAfterCall = Date.now();

    const updatedFee = await NoShowFee.findOne(fee.id);

    expect(updatedFee).to.matchPattern(`{
      cancelled_at: _.isBetween|${timestampBeforeCall - 1}|${timestampAfterCall + 1},
      ... 
    }`);

    const updatedClassPass = (await ClassPass.findOne(classPass.id)).toJSON();
    expect(updatedClassPass).to.matchPattern(`{
      valid_until: '2020-05-22',
      ...
    }`);

    const logEntries = await ClassPassLog.find({class_pass_id: classPass.id});
    expect(logEntries).to.matchPattern(`[{
      entry: 'No-show fee of 2 days cancelled for Yoga, Friday, May 15, 2020 10:00. Now valid until Friday, May 22, 2020. User: Admin Adminson (ID ${fixtures.userAdmin.id}).',
      ...
    }]`);

    expect(emailSendFake.getCall(0).args[0]).to.matchPattern({
      user: fixtures.userAlice.id,
      subject: 'No-show fee cancelled',
      text: 'Dear Alice,\n\nYour fee for not attending Yoga, Friday, May 15, 2020 10:00 has been cancelled. We have added 2 days to your class pass.\n\nKind regards,\nTest client',
      emailType: 'email_no_show_fee_cancelled_time_based_class_pass',
    });

    await ClassPass.destroy({id: classPass.id});
    await ClassSignup.destroy({id: signup.id});
    await NoShowFee.destroy({id: fee.id});

  });

  it('should cancel a fee for a time-based class pass with Danish log and email', async () => {

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
    }).fetch();

    const timestampBeforeCall = Date.now();

    await supertest(sails.hooks.http.app)
      .post(`/no-show-fees/${fee.id}/cancel?client=${testClientId}`)
      .use(authorizeAdmin())
      .expect(200);

    const timestampAfterCall = Date.now();

    const updatedFee = await NoShowFee.findOne(fee.id);

    expect(updatedFee).to.matchPattern(`{
      cancelled_at: _.isBetween|${timestampBeforeCall - 1}|${timestampAfterCall + 1},
      ... 
    }`);

    const updatedClassPass = (await ClassPass.findOne(classPass.id)).toJSON();
    expect(updatedClassPass).to.matchPattern(`{
      valid_until: '2020-05-22',
      ...
    }`);

    const logEntries = await ClassPassLog.find({class_pass_id: classPass.id});
    expect(logEntries).to.matchPattern(`[{
      entry: 'Gebyr for manglende fremmøde (2 dage) annulleret for Yoga, fredag d. 15. maj 2020 10:00. Nu gyldigt t.o.m. fredag d. 22. maj 2020. Bruger: Admin Adminson (ID ${fixtures.userAdmin.id}).',
      ...
    }]`);

    expect(emailSendFake.getCall(0).args[0]).to.matchPattern({
      user: fixtures.userAlice.id,
      subject: 'Gebyr for manglende fremmøde annulleret',
      text: 'Kære Alice\n\nDit gebyr for manglende fremmøde til Yoga, fredag d. 15. maj 2020 kl. 10:00 er annulleret. Der er lagt 2 dage til udløbsdatoen på dit adgangskort.\n\nMed venlig hilsen\nTest client',
      emailType: 'email_no_show_fee_cancelled_time_based_class_pass',
    });

    await ClassPass.destroy({id: classPass.id});
    await ClassSignup.destroy({id: signup.id});
    await NoShowFee.destroy({id: fee.id});
    await ClientSettings.destroy({id: clientSettingsRow.id});

  });

  it('should only cancel once, even on two simultaneous requests', async () => {
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
    }).fetch();

    const timestampBeforeCall = Date.now();

    await Promise.all([
      supertest(sails.hooks.http.app)
        .post(`/no-show-fees/${fee.id}/cancel?client=${testClientId}`)
        .use(authorizeAdmin())
        .expect(200),
      supertest(sails.hooks.http.app)
        .post(`/no-show-fees/${fee.id}/cancel?client=${testClientId}`)
        .use(authorizeAdmin())
        .expect(200),
    ]);


    const timestampAfterCall = Date.now();

    const updatedFee = await NoShowFee.findOne(fee.id);

    expect(updatedFee).to.matchPattern(`{
      cancelled_at: _.isBetween|${timestampBeforeCall - 1}|${timestampAfterCall + 1},
      ... 
    }`);

    const logEntries = await MembershipLog.find({membership: membership.id});
    expect(logEntries).to.matchPattern(`[{
      entry: 'No-show fee of 30 kr cancelled for Yoga, Friday, May 15, 2020 10:00. User: Admin Adminson (ID ${fixtures.userAdmin.id}).',
      ...
    }]`);

    expect(emailSendFake.callCount).to.equal(1);
    expect(emailSendFake.getCall(0).args[0]).to.matchPattern({
      user: fixtures.userAlice.id,
      subject: 'No-show fee cancelled',
      text: 'Dear Alice,\n\nYour fee of 30 kr for not attending Yoga, Friday, May 15, 2020 10:00, has been cancelled. The fee will not be charged.\n\nKind regards,\nTest client',
      emailType: 'email_no_show_fee_cancelled_membership',
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
    }).fetch();

    const timestampBeforeCall = Date.now();

    await supertest(sails.hooks.http.app)
        .post(`/no-show-fees/${fee.id}/cancel?client=${testClientId}`)
        .use(authorizeAdmin())
        .expect(200);

    const timestampAfterCall = Date.now();

    const updatedFee = await NoShowFee.findOne(fee.id);

    expect(updatedFee).to.matchPattern(`{
      cancelled_at: _.isBetween|${timestampBeforeCall - 1}|${timestampAfterCall + 1},
      ... 
    }`);

    const logEntries = await MembershipLog.find({membership: membership.id});
    expect(logEntries).to.matchPattern(`[{
      entry: 'No-show fee of 30 kr cancelled for Yoga, Friday, May 15, 2020 10:00. User: Admin Adminson (ID ${fixtures.userAdmin.id}).',
      ...
    }]`);

    expect(emailSendFake.callCount).to.equal(0);

    await Membership.destroy({id: membership.id});
    await ClassSignup.destroy({id: signup.id});
    await NoShowFee.destroy({id: fee.id});
  });

});
