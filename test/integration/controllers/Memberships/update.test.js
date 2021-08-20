const supertest = require('supertest');
const moment = require('moment-timezone');
const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID;
const fixtures = require('../../../fixtures/factory').fixtures;

const {authorizeUserAlice, authorizeUserBill, authorizeAdmin} = require('../../../utils/request-helpers');
const sinon = require('sinon');

const MockDate = require('mockdate');


describe('controllers.Memberships.update', () => {

  let emailSendFake;

  before(async () => {
    emailSendFake = sinon.fake();
    emailSendFake.with = emailSendFake;
    sinon.replace(sails.helpers.email, 'send', emailSendFake);
    await MembershipLog.destroy({});
    await ClientSettings.destroy({
      client: testClientId,
      key: 'locale',
    });
  });

  beforeEach(async () => {
  });

  afterEach(async () => {
    emailSendFake.resetHistory();
  });

  after(async () => {
    sinon.restore();
  });


  it('should deny access if user is not owner of the membership', async () => {

    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2016-06-15',
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'active',
      client: testClientId,
      payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
    }).fetch();

    await supertest(sails.hooks.http.app)
      .put(`/memberships/${membership.id}?client=${testClientId}`)
      .send(
        {
          status: 'cancelled_running',
        },
      )
      .use(authorizeUserBill())
      .expect(403);


    await Membership.destroy({id: membership.id});

  });

  it('should fail to cancel membership if it is not active', async () => {

    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2016-06-15',
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'ended',
      client: testClientId,
      payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
    }).fetch();

    await supertest(sails.hooks.http.app)
      .put(`/memberships/${membership.id}?client=${testClientId}`)
      .send(
        {
          status: 'cancelled_running',
        },
      )
      .use(authorizeAdmin())
      .expect(400)
      .expect('"E_MEMBERSHIP_NOT_ACTIVE"');


    await Membership.destroy({id: membership.id});

  });

  it('should silently pass a cancel membership request if membership is already cancelled and running', async () => {

    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2016-06-15',
      cancelled_from_date: '2016-07-16',
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'cancelled_running',
      client: testClientId,
      payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
    }).fetch();

    await supertest(sails.hooks.http.app)
      .put(`/memberships/${membership.id}?client=${testClientId}`)
      .send(
        {
          status: 'cancelled_running',
        },
      )
      .use(authorizeAdmin())
      .expect(200);

    await Membership.destroy({id: membership.id});

  });

  it('should cancel the membership by admin', async () => {

    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2016-06-15',
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'active',
      client: testClientId,
      payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
    }).fetch();

    const classes = await Class.createEach([
      {
        client: testClientId,
        class_type: fixtures.classTypeYoga.id,
        date: '2016-07-15',
        start_time: '12:00:00',
        end_time: '14:00:00',
      },
      {
        client: testClientId,
        class_type: fixtures.classTypeYoga.id,
        date: '2016-07-16',
        start_time: '12:00:00',
        end_time: '14:00:00',
      },
    ]).fetch();

    await ClassSignup.createEach([
      {
        client: testClientId,
        class: classes[0].id,
        user: fixtures.userAlice.id,
        used_membership: membership.id,
      },
      {
        client: testClientId,
        class: classes[1].id,
        user: fixtures.userAlice.id,
        used_membership: membership.id,
      },
    ]);

    const timestampBeforeCall = Date.now() - 1;

    await supertest(sails.hooks.http.app)
      .put(
        '/memberships/' + membership.id +
        '?client=' + testClientId)
      .send(
        {
          status: 'cancelled_running',
        },
      )
      .use(authorizeAdmin())
      .expect(200);

    const timestampAfterCall = Date.now() + 1;

    const updatedMembership = await Membership.findOne(membership.id);

    expect(updatedMembership.toJSON()).to.matchPattern(`{
      user: ${fixtures.userAlice.id},
      paid_until: '2016-06-15',
      cancelled_from_date: '2016-07-16',
      membership_type: ${fixtures.membershipTypeYogaUnlimited.id},
      status: 'cancelled_running',
      client: ${testClientId},
      payment_option: ${fixtures.yogaUnlimitedPaymentOptionMonthly.id},
      ...
    }`);

    const updatedSignups = await ClassSignup.find({}).sort('class ASC');

    expect(updatedSignups).to.matchPattern(`[
      {
        client: ${testClientId},
        class: ${classes[0].id},
        user: ${fixtures.userAlice.id},
        used_membership: ${membership.id},
        cancelled_at: 0,
        ...
      },
      {
        client: ${testClientId},
        class: ${classes[1].id},
        user: ${fixtures.userAlice.id},
        used_membership: ${membership.id},
        cancelled_at: _.isBetween|${timestampBeforeCall}|${timestampAfterCall},
        ...
      }
    ]`);

    expect(emailSendFake.firstCall.args[0]).to.matchPattern(`{        
        user: {id: ${fixtures.userAlice.id}, ...},
        subject: 'You have cancelled your Yoga Unlimited membership',
        blindCopyToClient: true,
        ...
      }`,
    );

    const logEntry = await MembershipLog.find({});
    expect(logEntry).to.matchPattern(`[{
      membership: ${membership.id},
      entry: 'Membership cancelled by admin. Last day Friday, July 15, 2016. Admin user: Admin Adminson.',
      ...
    }]`);

    await Class.destroy({});
    await ClassSignup.destroy({});
    await Membership.destroy({id: membership.id});
    await MembershipLog.destroy({});

  });

  it('should cancel the membership by admin, Danish locale', async () => {
    await ClassSignup.destroy({})

    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'locale',
      value: 'da',
    }).fetch();

    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2016-06-15',
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'active',
      client: testClientId,
      payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
    }).fetch();

    const classes = await Class.createEach([
      {
        client: testClientId,
        class_type: fixtures.classTypeYoga.id,
        date: '2016-07-15',
        start_time: '12:00:00',
        end_time: '14:00:00',
      },
      {
        client: testClientId,
        class_type: fixtures.classTypeYoga.id,
        date: '2016-07-16',
        start_time: '12:00:00',
        end_time: '14:00:00',
      },
    ]).fetch();

    await ClassSignup.createEach([
      {
        client: testClientId,
        class: classes[0].id,
        user: fixtures.userAlice.id,
        used_membership: membership.id,
      },
      {
        client: testClientId,
        class: classes[1].id,
        user: fixtures.userAlice.id,
        used_membership: membership.id,
      },
    ]);

    const timestampBeforeCall = Date.now() - 1;

    await supertest(sails.hooks.http.app)
      .put(
        '/memberships/' + membership.id +
        '?client=' + testClientId)
      .send(
        {
          status: 'cancelled_running',
        },
      )
      .use(authorizeAdmin())
      .expect(200);

    const timestampAfterCall = Date.now() + 1;

    const updatedMembership = await Membership.findOne(membership.id);

    expect(updatedMembership.toJSON()).to.matchPattern(`{
      user: ${fixtures.userAlice.id},
      paid_until: '2016-06-15',
      cancelled_from_date: '2016-07-16',
      membership_type: ${fixtures.membershipTypeYogaUnlimited.id},
      status: 'cancelled_running',
      client: ${testClientId},
      payment_option: ${fixtures.yogaUnlimitedPaymentOptionMonthly.id},
      ...
    }`);

    const updatedSignups = await ClassSignup.find({}).sort('class ASC');

    expect(updatedSignups).to.matchPattern(`[
      {
        client: ${testClientId},
        class: ${classes[0].id},
        user: ${fixtures.userAlice.id},
        used_membership: ${membership.id},
        cancelled_at: 0,
        ...
      },
      {
        client: ${testClientId},
        class: ${classes[1].id},
        user: ${fixtures.userAlice.id},
        used_membership: ${membership.id},
        cancelled_at: _.isBetween|${timestampBeforeCall}|${timestampAfterCall},
        ...
      }
    ]`);

    expect(emailSendFake.firstCall.args[0]).to.matchPattern(`{        
        user: {id: ${fixtures.userAlice.id}, ...},
        subject: 'Du har opsagt dit medlemskab Yoga Unlimited',
        blindCopyToClient: true,
        ...
      }`,
    );

    const logEntry = await MembershipLog.find({});
    expect(logEntry).to.matchPattern(`[{
      membership: ${membership.id},
      entry: 'Medlemskab stoppet af admin. Sidste dag fredag d. 15. juli 2016. Admin-bruger: Admin Adminson.',
      ...
    }]`);

    await ClientSettings.destroy({id: clientSettingsRow.id});
    await Class.destroy({});
    await ClassSignup.destroy({});
    await Membership.destroy({id: membership.id});
    await MembershipLog.destroy({});

  });

  it('should cancel the membership by customer', async () => {
    await ClassSignup.destroy({})

    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2016-06-15',
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'active',
      client: testClientId,
      payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
    }).fetch();

    const classes = await Class.createEach([
      {
        client: testClientId,
        class_type: fixtures.classTypeYoga.id,
        date: '2016-07-15',
        start_time: '12:00:00',
        end_time: '14:00:00',
      },
      {
        client: testClientId,
        class_type: fixtures.classTypeYoga.id,
        date: '2016-07-16',
        start_time: '12:00:00',
        end_time: '14:00:00',
      },
    ]).fetch();

    await ClassSignup.createEach([
      {
        client: testClientId,
        class: classes[0].id,
        user: fixtures.userAlice.id,
        used_membership: membership.id,
      },
      {
        client: testClientId,
        class: classes[1].id,
        user: fixtures.userAlice.id,
        used_membership: membership.id,
      },
    ]);

    const timestampBeforeCall = Date.now() - 1;

    await supertest(sails.hooks.http.app)
      .put(
        '/memberships/' + membership.id +
        '?client=' + testClientId)
      .send(
        {
          status: 'cancelled_running',
        },
      )
      .use(authorizeUserAlice())
      .expect(200);

    const timestampAfterCall = Date.now() + 1;

    const updatedMembership = await Membership.findOne(membership.id);

    expect(updatedMembership.toJSON()).to.matchPattern(`{
      user: ${fixtures.userAlice.id},
      paid_until: '2016-06-15',
      cancelled_from_date: '2016-07-16',
      membership_type: ${fixtures.membershipTypeYogaUnlimited.id},
      status: 'cancelled_running',
      client: ${testClientId},
      payment_option: ${fixtures.yogaUnlimitedPaymentOptionMonthly.id},
      ...
    }`);

    const updatedSignups = await ClassSignup.find({}).sort('class ASC');

    expect(updatedSignups).to.matchPattern(`[
      {
        client: ${testClientId},
        class: ${classes[0].id},
        user: ${fixtures.userAlice.id},
        used_membership: ${membership.id},
        cancelled_at: 0,
        ...
      },
      {
        client: ${testClientId},
        class: ${classes[1].id},
        user: ${fixtures.userAlice.id},
        used_membership: ${membership.id},
        cancelled_at: _.isBetween|${timestampBeforeCall}|${timestampAfterCall},
        ...
      }
    ]`);

    expect(emailSendFake.firstCall.args[0]).to.matchPattern(`{        
        user: {id: ${fixtures.userAlice.id}, ...},
        subject: 'You have cancelled your Yoga Unlimited membership',
        text: 'Dear Alice,\\n\\nYou have cancelled your Yoga Unlimited membership.\\n\\nThere is a one-month notice on the membership and therefore the membership will terminate one month after your next payment, i.e Saturday, July 16, 2016.\\n\\nKind regards,\\nTest client',
        blindCopyToClient: true,
        ...
      }`,
    );

    const logEntry = await MembershipLog.find({});
    expect(logEntry).to.matchPattern(`[{
      membership: ${membership.id},
      entry: 'Membership cancelled by customer. Last day 15. July 2016.',
      ...
    }]`);

    await Class.destroy({});
    await ClassSignup.destroy({});
    await Membership.destroy({id: membership.id});
    await MembershipLog.destroy({});

  });

  it('should cancel the membership by customer, Danish locale', async () => {

    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'locale',
      value: 'da',
    }).fetch();

    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2016-06-15',
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'active',
      client: testClientId,
      payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
    }).fetch();

    const classes = await Class.createEach([
      {
        client: testClientId,
        class_type: fixtures.classTypeYoga.id,
        date: '2016-07-15',
        start_time: '12:00:00',
        end_time: '14:00:00',
      },
      {
        client: testClientId,
        class_type: fixtures.classTypeYoga.id,
        date: '2016-07-16',
        start_time: '12:00:00',
        end_time: '14:00:00',
      },
    ]).fetch();

    await ClassSignup.createEach([
      {
        client: testClientId,
        class: classes[0].id,
        user: fixtures.userAlice.id,
        used_membership: membership.id,
      },
      {
        client: testClientId,
        class: classes[1].id,
        user: fixtures.userAlice.id,
        used_membership: membership.id,
      },
    ]);

    const timestampBeforeCall = Date.now() - 1;

    await supertest(sails.hooks.http.app)
      .put(
        '/memberships/' + membership.id +
        '?client=' + testClientId)
      .send(
        {
          status: 'cancelled_running',
        },
      )
      .use(authorizeUserAlice())
      .expect(200);

    const timestampAfterCall = Date.now() + 1;

    const updatedMembership = await Membership.findOne(membership.id);

    expect(updatedMembership.toJSON()).to.matchPattern(`{
      user: ${fixtures.userAlice.id},
      paid_until: '2016-06-15',
      cancelled_from_date: '2016-07-16',
      membership_type: ${fixtures.membershipTypeYogaUnlimited.id},
      status: 'cancelled_running',
      client: ${testClientId},
      payment_option: ${fixtures.yogaUnlimitedPaymentOptionMonthly.id},
      ...
    }`);

    const updatedSignups = await ClassSignup.find({}).sort('class ASC');

    expect(updatedSignups).to.matchPattern(`[
      {
        client: ${testClientId},
        class: ${classes[0].id},
        user: ${fixtures.userAlice.id},
        used_membership: ${membership.id},
        cancelled_at: 0,
        ...
      },
      {
        client: ${testClientId},
        class: ${classes[1].id},
        user: ${fixtures.userAlice.id},
        used_membership: ${membership.id},
        cancelled_at: _.isBetween|${timestampBeforeCall}|${timestampAfterCall},
        ...
      }
    ]`);

    expect(emailSendFake.firstCall.args[0]).to.matchPattern(`{        
        user: {id: ${fixtures.userAlice.id}, ...},
        subject: 'Du har opsagt dit medlemskab Yoga Unlimited',
        blindCopyToClient: true,
        ...
      }`,
    );

    const logEntry = await MembershipLog.find({});
    expect(logEntry).to.matchPattern(`[{
      membership: ${membership.id},
      entry: 'Medlemskab stoppet af kunden. Sidste dag 15. juli 2016.',
      ...
    }]`);

    await ClientSettings.destroy({id: clientSettingsRow.id});
    await Class.destroy({});
    await ClassSignup.destroy({});
    await Membership.destroy({id: membership.id});
    await MembershipLog.destroy({});

  });

  it('should cancel without the extra month if payment option is more than one month', async () => {
    await ClassSignup.destroy({})

    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2016-06-15',
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'active',
      client: testClientId,
      payment_option: fixtures.yogaUnlimitedPaymentOptionSemiannually.id,
    }).fetch();

    const classes = await Class.createEach([
      {
        client: testClientId,
        class_type: fixtures.classTypeYoga.id,
        date: '2016-06-15',
        start_time: '12:00:00',
        end_time: '14:00:00',
      },
      {
        client: testClientId,
        class_type: fixtures.classTypeYoga.id,
        date: '2016-06-16',
        start_time: '12:00:00',
        end_time: '14:00:00',
      },
    ]).fetch();

    await ClassSignup.createEach([
      {
        client: testClientId,
        class: classes[0].id,
        user: fixtures.userAlice.id,
        used_membership: membership.id,
      },
      {
        client: testClientId,
        class: classes[1].id,
        user: fixtures.userAlice.id,
        used_membership: membership.id,
      },
    ]);

    const timestampBeforeCall = Date.now() - 1;

    await supertest(sails.hooks.http.app)
      .put(
        '/memberships/' + membership.id +
        '?client=' + testClientId)
      .send(
        {
          status: 'cancelled_running',
        },
      )
      .use(authorizeUserAlice())
      .expect(200);

    const timestampAfterCall = Date.now() + 1;

    const updatedMembership = await Membership.findOne(membership.id);

    expect(updatedMembership.toJSON()).to.matchPattern(`{
      user: ${fixtures.userAlice.id},
      paid_until: '2016-06-15',
      cancelled_from_date: '2016-06-16',
      membership_type: ${fixtures.membershipTypeYogaUnlimited.id},
      status: 'cancelled_running',
      client: ${testClientId},
      payment_option: ${fixtures.yogaUnlimitedPaymentOptionSemiannually.id},
      ...
    }`);

    const updatedSignups = await ClassSignup.find({}).sort('class ASC');

    expect(updatedSignups).to.matchPattern(`[
      {
        client: ${testClientId},
        class: ${classes[0].id},
        user: ${fixtures.userAlice.id},
        used_membership: ${membership.id},
        cancelled_at: 0,
        ...
      },
      {
        client: ${testClientId},
        class: ${classes[1].id},
        user: ${fixtures.userAlice.id},
        used_membership: ${membership.id},
        cancelled_at: _.isBetween|${timestampBeforeCall}|${timestampAfterCall},
        ...
      }
    ]`);

    expect(emailSendFake.firstCall.args[0]).to.matchPattern(`{        
        user: {id: ${fixtures.userAlice.id}, ...},
        subject: 'You have cancelled your Yoga Unlimited membership',
        text: 'Dear Alice,\\n\\nYou have cancelled your Yoga Unlimited membership.\\n\\nThe membership will terminate at the end of the paid period, i.e Thursday, June 16, 2016.\\n\\nKind regards,\\nTest client',
        blindCopyToClient: true,
        ...
      }`,
    );

    const logEntry = await MembershipLog.find({});
    expect(logEntry).to.matchPattern(`[{
      membership: ${membership.id},
      entry: 'Membership cancelled by customer. Last day 15. June 2016.',
      ...
    }]`);

    await Class.destroy({});
    await ClassSignup.destroy({});
    await Membership.destroy({id: membership.id});
    await MembershipLog.destroy({});

  });

  it('should silently pass re-activating if membership is already active', async () => {
    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2016-06-15',
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'active',
      client: testClientId,
      payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
    }).fetch();

    await supertest(sails.hooks.http.app)
      .put(`/memberships/${membership.id}?client=${testClientId}`)
      .send(
        {
          status: 'active',
        },
      )
      .use(authorizeAdmin())
      .expect(200);

    await Membership.destroy({id: membership.id});

  });

  it('should fail to re-activate if membership has run out', async () => {
    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2016-06-15',
      cancelled_from_date: '2016-07-16',
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'ended',
      client: testClientId,
      payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
    }).fetch();

    MockDate.set(moment.tz('2016-07-15', 'Europe/Copenhagen'));
    await supertest(sails.hooks.http.app)
      .put(`/memberships/${membership.id}?client=${testClientId}`)
      .send(
        {
          status: 'active',
        },
      )
      .use(authorizeAdmin())
      .expect(400)
      .expect('"E_MEMBERSHIP_HAS_RUN_OUT"');


    await Membership.update({id: membership.id}, {
      status: 'cancelled_running',
    });

    MockDate.set(moment.tz('2016-07-16', 'Europe/Copenhagen'));

    await supertest(sails.hooks.http.app)
      .put(`/memberships/${membership.id}?client=${testClientId}`)
      .send(
        {
          status: 'active',
        },
      )
      .use(authorizeAdmin())
      .expect(400)
      .expect('"E_MEMBERSHIP_HAS_RUN_OUT"');

    await Membership.destroy({id: membership.id});
    MockDate.reset();
  });

  it('should re-activate the membership by admin', async () => {

    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2016-06-15',
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'cancelled_running',
      cancelled_from_date: '2016-07-16',
      client: testClientId,
      payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
    }).fetch();

    MockDate.set('6/12/2016');

    await supertest(sails.hooks.http.app)
      .put(
        '/memberships/' + membership.id +
        '?client=' + testClientId)
      .send(
        {
          status: 'active',
        },
      )
      .use(authorizeAdmin())
      .expect(200);

    MockDate.reset();

    expect(emailSendFake.firstCall.args[0]).to.matchPattern(`
      {
        user: {id: ${fixtures.userAlice.id}, ...},
        subject: 'You have re-activated your Yoga Unlimited membership',
        blindCopyToClient: true,
        ...
      }`,
    );

    const logEntry = await MembershipLog.find({});
    expect(logEntry).to.matchPattern(`[{
      membership: ${membership.id},
      entry: 'Membership re-activated by admin. User: Admin Adminson.',
      ...
    }]`);


    await Membership.destroy({id: membership.id});
    await MembershipLog.destroy({});

  });

  it('should re-activate the membership by admin, Danish locale', async () => {

    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2016-06-15',
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'cancelled_running',
      cancelled_from_date: '2016-07-16',
      client: testClientId,
      payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
    }).fetch();

    MockDate.set('6/12/2016');

    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'locale',
      value: 'da',
    }).fetch();

    await supertest(sails.hooks.http.app)
      .put(
        '/memberships/' + membership.id +
        '?client=' + testClientId)
      .send(
        {
          status: 'active',
        },
      )
      .use(authorizeAdmin())
      .expect(200);

    MockDate.reset();

    expect(emailSendFake.firstCall.args[0]).to.matchPattern(`
      {
        user: {id: ${fixtures.userAlice.id}, ...},
        subject: 'Du har genoptaget dit medlemskab Yoga Unlimited',
        blindCopyToClient: true,
        ...
      }`,
    );

    const logEntry = await MembershipLog.find({});
    expect(logEntry).to.matchPattern(`[{
      membership: ${membership.id},
      entry: 'Medlemskab genoptaget af admin. Bruger: Admin Adminson.',
      ...
    }]`);


    await Membership.destroy({id: membership.id});
    await MembershipLog.destroy({});
    await ClientSettings.destroy({id: clientSettingsRow.id});

  });

  it('should re-activate the membership by customer', async () => {

    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2016-06-15',
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'cancelled_running',
      cancelled_from_date: '2016-07-16',
      client: testClientId,
      payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
    }).fetch();

    MockDate.set('6/12/2016');

    await supertest(sails.hooks.http.app)
      .put(
        '/memberships/' + membership.id +
        '?client=' + testClientId)
      .send(
        {
          status: 'active',
        },
      )
      .use(authorizeUserAlice())
      .expect(200);

    MockDate.reset();

    expect(emailSendFake.firstCall.args[0]).to.matchPattern(`
      {
        user: {id: ${fixtures.userAlice.id}, ...},
        subject: 'You have re-activated your Yoga Unlimited membership',
        blindCopyToClient: true,
        ...
      }`,
    );

    const membershipLogEntry = await knex({ml: 'membership_log'});

    expect(membershipLogEntry).to.matchPattern(`[{
      entry: 'Membership re-activated by customer.',
      ...
    }]`);
    await Membership.destroy({id: membership.id});
    await MembershipLog.destroy({});

  });

  it('should re-activate the membership by customer, Danish locale', async () => {

    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2016-06-15',
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'cancelled_running',
      cancelled_from_date: '2016-07-16',
      client: testClientId,
      payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
    }).fetch();

    MockDate.set('6/12/2016');

    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'locale',
      value: 'da',
    }).fetch();

    await supertest(sails.hooks.http.app)
      .put(
        '/memberships/' + membership.id +
        '?client=' + testClientId)
      .send(
        {
          status: 'active',
        },
      )
      .use(authorizeUserAlice())
      .expect(200);

    MockDate.reset();

    expect(emailSendFake.firstCall.args[0]).to.matchPattern(`
      {
        user: {id: ${fixtures.userAlice.id}, ...},
        subject: 'Du har genoptaget dit medlemskab Yoga Unlimited',
        blindCopyToClient: true,
        ...
      }`,
    );

    const membershipLogEntry = await knex({ml: 'membership_log'});

    expect(membershipLogEntry).to.matchPattern(`[{
      entry: 'Medlemskab genoptaget af kunden.',
      ...
    }]`);
    await Membership.destroy({id: membership.id});
    await MembershipLog.destroy({});
    await ClientSettings.destroy({id: clientSettingsRow.id});

  });

  it('should not allow customer to stop membership immediately', async () => {

    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2016-06-15',
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'active',
      client: testClientId,
      payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
    }).fetch();

    await supertest(sails.hooks.http.app)
      .put(`/memberships/${membership.id}?client=${testClientId}`)
      .send(
        {
          status: 'ended',
        },
      )
      .use(authorizeUserAlice())
      .expect(403);


    await Membership.destroy({id: membership.id});

  });

  it('should stop the membership', async () => {

    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2016-06-15',
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'active',
      client: testClientId,
      payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
    }).fetch();

    const classes = await Class.createEach([
      {
        client: testClientId,
        class_type: fixtures.classTypeYoga.id,
        date: '2020-06-12',
        start_time: '12:00:00',
        end_time: '14:00:00',
      },
      {
        client: testClientId,
        class_type: fixtures.classTypeYoga.id,
        date: '2020-06-12',
        start_time: '12:02:00',
        end_time: '14:00:00',
      },
    ]).fetch();

    await ClassSignup.createEach([
      {
        client: testClientId,
        class: classes[0].id,
        user: fixtures.userAlice.id,
        used_membership: membership.id,
      },
      {
        client: testClientId,
        class: classes[1].id,
        user: fixtures.userAlice.id,
        used_membership: membership.id,
      },
    ]);

    MockDate.set(moment.tz('2020-06-12 12:01:00', 'Europe/Copenhagen'));

    const timestampBeforeCall = Date.now() - 1;

    await supertest(sails.hooks.http.app)
      .put(
        '/memberships/' + membership.id +
        '?client=' + testClientId)
      .send(
        {
          status: 'ended',
        },
      )
      .use(authorizeAdmin())
      .expect(200);

    const timestampAfterCall = Date.now() + 1;

    const updatedMembership = await Membership.findOne(membership.id);

    expect(updatedMembership.toJSON()).to.matchPattern(`{
      user: ${fixtures.userAlice.id},
      paid_until: '2016-06-15',
      cancelled_from_date: null,
      membership_type: ${fixtures.membershipTypeYogaUnlimited.id},
      status: 'ended',
      ended_because: 'admin_action',
      client: ${testClientId},
      payment_option: ${fixtures.yogaUnlimitedPaymentOptionMonthly.id},
      ...
    }`);

    const updatedSignups = await ClassSignup.find({});

    expect(updatedSignups).to.matchPattern(`[
      {
        client: ${testClientId},
        class: ${classes[0].id},
        user: ${fixtures.userAlice.id},
        used_membership: ${membership.id},
        cancelled_at: 0,
        ...
      },
      {
        client: ${testClientId},
        class: ${classes[1].id},
        user: ${fixtures.userAlice.id},
        used_membership: ${membership.id},
        cancelled_at: _.isBetween|${timestampBeforeCall}|${timestampAfterCall},
        ...
      }
    ]`);

    expect(emailSendFake.callCount).to.equal(0);

    // TODO: Check log

    MockDate.reset();
    await Class.destroy({});
    await ClassSignup.destroy({});
    await Membership.destroy({id: membership.id});
    await MembershipLog.destroy({});

  });

  it('should not allow user to change discount code', async () => {

    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2016-06-15',
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'active',
      client: testClientId,
      payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
    }).fetch();

    const discountCode = await DiscountCode.create({
      name: 'Test code',
    }).fetch();

    await supertest(sails.hooks.http.app)
      .put(`/memberships/${membership.id}?client=${testClientId}`)
      .send(
        {
          discount_code: discountCode.id,
        },
      )
      .use(authorizeUserAlice())
      .expect(403);


    await Membership.destroy({id: membership.id});
    await DiscountCode.destroy({id: discountCode.id});

  });

  it('should add a discount code to membership', async () => {

    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2016-06-15',
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'active',
      client: testClientId,
      payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
    }).fetch();

    const discountCode = await DiscountCode.create({
      name: 'Test code',
    }).fetch();

    await supertest(sails.hooks.http.app)
      .put(
        '/memberships/' + membership.id +
        '?client=' + testClientId)
      .send(
        {
          discount_code: discountCode.id,
        },
      )
      .use(authorizeAdmin())
      .expect(200);

    const updatedMembership = await Membership.findOne(membership.id);

    expect(updatedMembership).to.matchPattern(`{
      id: ${membership.id},
      status: 'active',
      discount_code: ${discountCode.id},
      ...
    }`);

    const membershipLogEntry = await knex({ml: 'membership_log'});

    expect(membershipLogEntry).to.matchPattern(`[{
      entry: 'Discount code "Test code" added by admin. User: Admin Adminson.',     
      ...
    }]`);

    await MembershipLog.destroy({});
    await Membership.destroy({id: membership.id});
    await DiscountCode.destroy({id: discountCode.id});

  });

  it('should add a discount code to membership, Danish locale', async () => {

    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2016-06-15',
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'active',
      client: testClientId,
      payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
    }).fetch();

    const discountCode = await DiscountCode.create({
      name: 'Test code',
    }).fetch();

    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'locale',
      value: 'da',
    }).fetch();

    await supertest(sails.hooks.http.app)
      .put(
        '/memberships/' + membership.id +
        '?client=' + testClientId)
      .send(
        {
          discount_code: discountCode.id,
        },
      )
      .use(authorizeAdmin())
      .expect(200);

    const membershipLogEntry = await knex({ml: 'membership_log'});

    expect(membershipLogEntry).to.matchPattern(`[{
      entry: 'Rabatkode "Test code" tilføjet via admin. Bruger: Admin Adminson.',
      ...
    }]`);

    await ClientSettings.destroy({id: clientSettingsRow.id});
    await MembershipLog.destroy({});
    await Membership.destroy({id: membership.id});
    await DiscountCode.destroy({id: discountCode.id});

  });

  it('should remove a discount code from a membership', async () => {

    const discountCode = await DiscountCode.create({
      name: 'Test code',
    }).fetch();

    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2016-06-15',
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'active',
      client: testClientId,
      payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
      discount_code: discountCode.id,
    }).fetch();

    await supertest(sails.hooks.http.app)
      .put(
        '/memberships/' + membership.id +
        '?client=' + testClientId)
      .send(
        {
          discount_code: null,
        },
      )
      .use(authorizeAdmin())
      .expect(200);

    const updatedMembership = await Membership.findOne(membership.id);

    expect(updatedMembership).to.matchPattern(`{
      id: ${membership.id},
      status: 'active',
      discount_code: null,
      ...
    }`);

    const membershipLogEntry = await knex({ml: 'membership_log'});

    expect(membershipLogEntry).to.matchPattern(`[{
      entry: 'Discount code "Test code" removed by admin. User: Admin Adminson.',     
      ...
    }]`);

    await MembershipLog.destroy({});
    await Membership.destroy({id: membership.id});
    await DiscountCode.destroy({id: discountCode.id});

  });

  it('should remove a discount code from a membership, Danish locale', async () => {

    const discountCode = await DiscountCode.create({
      name: 'Test code',
    }).fetch();

    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2016-06-15',
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'active',
      client: testClientId,
      payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
      discount_code: discountCode.id,
    }).fetch();

    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'locale',
      value: 'da',
    }).fetch();

    await supertest(sails.hooks.http.app)
      .put(
        '/memberships/' + membership.id +
        '?client=' + testClientId)
      .send(
        {
          discount_code: null,
        },
      )
      .use(authorizeAdmin())
      .expect(200);

    const membershipLogEntry = await knex({ml: 'membership_log'});

    expect(membershipLogEntry).to.matchPattern(`[{
      entry: 'Rabatkode "Test code" fjernet via admin. Bruger: Admin Adminson.',
      ...
    }]`);

    await ClientSettings.destroy({id: clientSettingsRow.id});
    await MembershipLog.destroy({});
    await Membership.destroy({id: membership.id});
    await DiscountCode.destroy({id: discountCode.id});

  });

  it('should replace a discount code on a membership', async () => {

    const discountCode1 = await DiscountCode.create({
      name: 'Test code 1',
    }).fetch();

    const discountCode2 = await DiscountCode.create({
      name: 'Test code 2',
    }).fetch();

    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2016-06-15',
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'active',
      client: testClientId,
      payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
      discount_code: discountCode1.id,
    }).fetch();

    await supertest(sails.hooks.http.app)
      .put(
        '/memberships/' + membership.id +
        '?client=' + testClientId)
      .send(
        {
          discount_code: discountCode2.id,
        },
      )
      .use(authorizeAdmin())
      .expect(200);

    const updatedMembership = await Membership.findOne(membership.id);

    expect(updatedMembership).to.matchPattern(`{
      id: ${membership.id},
      status: 'active',
      discount_code: ${discountCode2.id},
      ...
    }`);

    const membershipLogEntry = await knex({ml: 'membership_log'});

    expect(membershipLogEntry).to.matchPattern(`[{
      entry: 'Discount code changed from "Test code 1" to "Test code 2" by admin. User: Admin Adminson.',     
      ...
    }]`);

    await MembershipLog.destroy({});
    await Membership.destroy({id: membership.id});
    await DiscountCode.destroy({id: [discountCode1.id, discountCode2.id]});

  });

  it('should replace a discount code on a membership, Danish locale', async () => {

    const discountCode1 = await DiscountCode.create({
      name: 'Test code 1',
    }).fetch();

    const discountCode2 = await DiscountCode.create({
      name: 'Test code 2',
    }).fetch();

    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2016-06-15',
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'active',
      client: testClientId,
      payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
      discount_code: discountCode1.id,
    }).fetch();

    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'locale',
      value: 'da',
    }).fetch();

    await supertest(sails.hooks.http.app)
      .put(
        '/memberships/' + membership.id +
        '?client=' + testClientId)
      .send(
        {
          discount_code: discountCode2.id,
        },
      )
      .use(authorizeAdmin())
      .expect(200);

    const membershipLogEntry = await knex({ml: 'membership_log'});

    expect(membershipLogEntry).to.matchPattern(`[{
      entry: 'Rabatkode ændret via admin fra "Test code 1" til "Test code 2". Bruger: Admin Adminson.',
      ...
    }]`);

    await ClientSettings.destroy({id: clientSettingsRow.id});
    await MembershipLog.destroy({});
    await Membership.destroy({id: membership.id});
    await DiscountCode.destroy({id: [discountCode1.id, discountCode2.id]});

  });

  it('should silently pass if removing a non-existent discount code', async () => {

    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2016-06-15',
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'active',
      client: testClientId,
      payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
    }).fetch();

    await supertest(sails.hooks.http.app)
      .put(
        '/memberships/' + membership.id +
        '?client=' + testClientId)
      .send(
        {
          discount_code: null,
        },
      )
      .use(authorizeAdmin())
      .expect(200);

    const updatedMembership = await Membership.findOne(membership.id);

    expect(updatedMembership).to.matchPattern(`{
      id: ${membership.id},
      status: 'active',
      discount_code: null,
      ...
    }`);

    const membershipLogEntry = await knex({ml: 'membership_log'});

    expect(membershipLogEntry).to.matchPattern(`[]`);

    await MembershipLog.destroy({});
    await Membership.destroy({id: membership.id});

  });

  it('should fail to change to invalid payment_option', async () => {

    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2016-06-15',
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'active',
      client: testClientId,
      payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
    }).fetch();

    const invalidPaymentOption = await MembershipTypePaymentOption.create({
      client: testClientId,
      membership_type: fixtures.membershipTypeYogaUnlimited.id + 1,
      name: 'Monthly',
      number_of_months_payment_covers: 1,
      payment_amount: 300,
      for_sale: true,
    }).fetch();

    await supertest(sails.hooks.http.app)
      .put(`/memberships/${membership.id}?client=${testClientId}`)
      .send(
        {
          payment_option: invalidPaymentOption.id,
        },
      )
      .use(authorizeAdmin())
      .expect(400)
      .expect('"Payment option does not belong to current membership type."');


    await Membership.destroy({id: membership.id});
    await MembershipTypePaymentOption.destroy({id: invalidPaymentOption.id});

  });

  it('should not allow user to change payment_option', async () => {

    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2016-06-15',
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'active',
      client: testClientId,
      payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
    }).fetch();

    await supertest(sails.hooks.http.app)
      .put(`/memberships/${membership.id}?client=${testClientId}`)
      .send(
        {
          payment_option: fixtures.yogaUnlimitedPaymentOptionSemiannually.id,
        },
      )
      .use(authorizeUserAlice())
      .expect(403);


    await Membership.destroy({id: membership.id});

  });

  it('should change payment option', async () => {

    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2016-06-15',
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'active',
      client: testClientId,
      payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
    }).fetch();

    await supertest(sails.hooks.http.app)
      .put(
        '/memberships/' + membership.id +
        '?client=' + testClientId)
      .send(
        {
          payment_option: fixtures.yogaUnlimitedPaymentOptionSemiannually.id,
        },
      )
      .use(authorizeAdmin())
      .expect(200);

    const updatedMembership = await Membership.findOne(membership.id);

    expect(updatedMembership).to.matchPattern(`{
      id: ${membership.id},
      status: 'active',
      payment_option: ${fixtures.yogaUnlimitedPaymentOptionSemiannually.id},
      ...
    }`);

    const membershipLogEntry = await knex({ml: 'membership_log'});

    expect(membershipLogEntry).to.matchPattern(`[{
      entry: 'Payment option changed by admin from Monthly / 300,00 kr. to Semiannually / 1.500,00 kr. User: Admin Adminson.',
      ...
    }]`);

    await MembershipLog.destroy({});
    await Membership.destroy({id: membership.id});

  });

  it('should change payment option, Danish locale', async () => {

    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2016-06-15',
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'active',
      client: testClientId,
      payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
    }).fetch();

    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'locale',
      value: 'da',
    }).fetch();

    await supertest(sails.hooks.http.app)
      .put(
        '/memberships/' + membership.id +
        '?client=' + testClientId)
      .send(
        {
          payment_option: fixtures.yogaUnlimitedPaymentOptionSemiannually.id,
        },
      )
      .use(authorizeAdmin())
      .expect(200);

    const updatedMembership = await Membership.findOne(membership.id);

    expect(updatedMembership).to.matchPattern(`{
      id: ${membership.id},
      status: 'active',
      payment_option: ${fixtures.yogaUnlimitedPaymentOptionSemiannually.id},
      ...
    }`);

    const membershipLogEntry = await knex({ml: 'membership_log'});

    expect(membershipLogEntry).to.matchPattern(`[{
      entry: 'Betalingsperiode ændret via admin fra Monthly / 300,00 kr. til Semiannually / 1.500,00 kr. Bruger: Admin Adminson.',
      ...
    }]`);

    await MembershipLog.destroy({});
    await Membership.destroy({id: membership.id});
    await ClientSettings.destroy({id: clientSettingsRow.id});

  });

  it('should fail if new payment option does not belong to new membership type', async () => {

    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2016-06-15',
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'active',
      client: testClientId,
      payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
    }).fetch();

    await supertest(sails.hooks.http.app)
      .put(`/memberships/${membership.id}?client=${testClientId}`)
      .send(
        {
          membership_type: fixtures.membershipTypeYogaUnlimitedLivestream.id,
          payment_option: fixtures.yogaUnlimitedPaymentOptionSemiannually.id,
        },
      )
      .use(authorizeAdmin())
      .expect(400)
      .expect('"Payment option does not belong to membership type."');


    await Membership.destroy({id: membership.id});

  });

  it('should not allow user to change membership_type', async () => {

    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2016-06-15',
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'active',
      client: testClientId,
      payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
    }).fetch();

    await supertest(sails.hooks.http.app)
      .put(`/memberships/${membership.id}?client=${testClientId}`)
      .send(
        {
          membership_type: fixtures.membershipTypeYogaUnlimitedLivestream.id,
          payment_option: fixtures.yogaUnlimitedLivestreamPaymentOptionMonthly.id,
        },
      )
      .use(authorizeUserAlice())
      .expect(403);


    await Membership.destroy({id: membership.id});

  });

  it('should change membership type', async () => {

    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2016-06-15',
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'active',
      client: testClientId,
      payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
    }).fetch();

    await supertest(sails.hooks.http.app)
      .put(
        '/memberships/' + membership.id +
        '?client=' + testClientId)
      .send(
        {
          membership_type: fixtures.membershipTypeYogaUnlimitedLivestream.id,
          payment_option: fixtures.yogaUnlimitedLivestreamPaymentOptionMonthly.id,
        },
      )
      .use(authorizeAdmin())
      .expect(200);

    const updatedMembership = await Membership.findOne(membership.id);

    expect(updatedMembership).to.matchPattern(`{
      id: ${membership.id},
      status: 'active',
      membership_type: ${fixtures.membershipTypeYogaUnlimitedLivestream.id},
      payment_option: ${fixtures.yogaUnlimitedLivestreamPaymentOptionMonthly.id},
      ...
    }`);

    const membershipLogEntry = await knex({ml: 'membership_log'});

    expect(membershipLogEntry).to.matchPattern(`[{
      entry: 'Membership type changed by admin from Yoga Unlimited, Monthly / 300,00 kr. to Yoga Unlimited Livestream, Livestream monthly / 150,00 kr. User: Admin Adminson.',
      ...
    }]`);

    await MembershipLog.destroy({});
    await Membership.destroy({id: membership.id});

  });

  it('should change membership type, Danish locale', async () => {

    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2016-06-15',
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'active',
      client: testClientId,
      payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
    }).fetch();

    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'locale',
      value: 'da',
    }).fetch();

    await supertest(sails.hooks.http.app)
      .put(
        '/memberships/' + membership.id +
        '?client=' + testClientId)
      .send(
        {
          membership_type: fixtures.membershipTypeYogaUnlimitedLivestream.id,
          payment_option: fixtures.yogaUnlimitedLivestreamPaymentOptionMonthly.id,
        },
      )
      .use(authorizeAdmin())
      .expect(200);

    const updatedMembership = await Membership.findOne(membership.id);

    expect(updatedMembership).to.matchPattern(`{
      id: ${membership.id},
      status: 'active',
      membership_type: ${fixtures.membershipTypeYogaUnlimitedLivestream.id},
      payment_option: ${fixtures.yogaUnlimitedLivestreamPaymentOptionMonthly.id},
      ...
    }`);

    const membershipLogEntry = await knex({ml: 'membership_log'});

    expect(membershipLogEntry).to.matchPattern(`[{
      entry: 'Medlemskab ændret via admin fra Yoga Unlimited, Monthly / 300,00 kr. til Yoga Unlimited Livestream, Livestream monthly / 150,00 kr. Bruger: Admin Adminson.',
      ...
    }]`);

    await MembershipLog.destroy({});
    await Membership.destroy({id: membership.id});
    await ClientSettings.destroy({id: clientSettingsRow.id});

  });

  it('should not allow user to change paid_until', async () => {

    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2016-06-15',
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'active',
      client: testClientId,
      payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
    }).fetch();

    await supertest(sails.hooks.http.app)
      .put(`/memberships/${membership.id}?client=${testClientId}`)
      .send(
        {
          paid_until: '2016-06-20',
        },
      )
      .use(authorizeUserAlice())
      .expect(403);

    await Membership.destroy({id: membership.id});

  });

  it('should fail to change paid_until if date is more than 28 days before today', async () => {

    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2016-06-15',
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'active',
      client: testClientId,
      payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
    }).fetch();

    MockDate.set(moment.tz('2016-06-10', 'Europe/Copenhagen'));
    await supertest(sails.hooks.http.app)
      .put(
        '/memberships/' + membership.id +
        '?client=' + testClientId)
      .send(
        {
          paid_until: '2016-05-10',
        },
      )
      .use(authorizeAdmin())
      .expect(400)
      .expect('"New paid_until can not be more than 28 days before today."');

    MockDate.reset();
    await Membership.destroy({id: membership.id});

  });

  it('should change paid_until', async () => {

    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2016-06-15',
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'active',
      client: testClientId,
      payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
    }).fetch();

    MockDate.set(moment.tz('2016-06-10', 'Europe/Copenhagen'));
    await supertest(sails.hooks.http.app)
      .put(
        '/memberships/' + membership.id +
        '?client=' + testClientId)
      .send(
        {
          paid_until: '2016-06-22',
        },
      )
      .use(authorizeAdmin())
      .expect(200);

    const updatedMembership = await Membership.findOne(membership.id);

    expect(updatedMembership.toJSON()).to.matchPattern(`{
      id: ${membership.id},
      status: 'active',
      paid_until: '2016-06-22',
      ...
    }`);

    const membershipLogEntry = await knex({ml: 'membership_log'});

    expect(membershipLogEntry).to.matchPattern(`[{
      entry: 'Next payment date changed by admin from Thursday, June 16, 2016 to Thursday, June 23, 2016. User: Admin Adminson.',
      ...
    }]`);

    expect(emailSendFake.callCount).to.equal(0);

    MockDate.reset();
    await MembershipLog.destroy({});
    await Membership.destroy({id: membership.id});

  });

  it('should change paid_until, Danish locale', async () => {

    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2016-06-15',
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'active',
      client: testClientId,
      payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
    }).fetch();

    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'locale',
      value: 'da',
    }).fetch();

    MockDate.set(moment.tz('2016-06-10', 'Europe/Copenhagen'));

    await supertest(sails.hooks.http.app)
      .put(
        '/memberships/' + membership.id +
        '?client=' + testClientId)
      .send(
        {
          paid_until: '2016-06-22',
        },
      )
      .use(authorizeAdmin())
      .expect(200);

    const updatedMembership = await Membership.findOne(membership.id);

    expect(updatedMembership.toJSON()).to.matchPattern(`{
      id: ${membership.id},
      status: 'active',
      paid_until: '2016-06-22',
      ...
    }`);

    const membershipLogEntry = await knex({ml: 'membership_log'});

    expect(membershipLogEntry).to.matchPattern(`[{
      entry: 'Næste betalingsdato ændret via admin fra torsdag d. 16. juni 2016 til torsdag d. 23. juni 2016. Bruger: Admin Adminson.',
      ...
    }]`);

    MockDate.reset();
    await MembershipLog.destroy({});
    await Membership.destroy({id: membership.id});
    await ClientSettings.destroy({id: clientSettingsRow.id});

  });

  it('should return badRequest if data is invalid', async () => {

    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2016-06-15',
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'active',
      client: testClientId,
      payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
    }).fetch();

    await supertest(sails.hooks.http.app)
      .put(`/memberships/${membership.id}?client=${testClientId}`)
      .use(authorizeAdmin())
      .expect(400)
      .expect('"Updating membership, but input data was invalid."');


    await Membership.destroy({id: membership.id});

  });

});
