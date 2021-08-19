const moment = require('moment-timezone');
const supertest = require('supertest');

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID;
const fixtures = require('../../../fixtures/factory').fixtures;
const {
  authorizeAdmin,
  authorizeUserAlice,
  acceptExtendedErrorFormat,
} = require('../../../utils/request-helpers');

const MockDate = require('mockdate');

describe('controllers.MembershipPauses.destroy', async function () {

  before(async () => {
    await MembershipLog.destroy({});
  });

  beforeEach(async () => {
    await MembershipLog.destroy({});
  });

  afterEach(async () => {
  });

  it('should fail if user is not logged in', async () => {

    const membership = await Membership.create({
      client: testClientId,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      paid_until: '2020-05-31',
      status: 'active',
      user: fixtures.userAlice.id,
    }).fetch();

    const membershipPause = await MembershipPause.create({
      client_id: testClientId,
      membership_id: membership.id,
      start_date: '2020-06-01',
    }).fetch();

    await supertest(sails.hooks.http.app)
      .delete(`/membership-pauses/${membershipPause.id}?client=${testClientId}`)
      .expect(403);

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: membershipPause.id});
  });

  it('should fail if user is the customer owning the membership', async () => {

    const membership = await Membership.create({
      client: testClientId,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      paid_until: '2020-05-31',
      status: 'active',
      user: fixtures.userAlice.id,
    }).fetch();

    const membershipPause = await MembershipPause.create({
      client_id: testClientId,
      membership_id: membership.id,
      start_date: '2020-06-01',
    }).fetch();

    await supertest(sails.hooks.http.app)
      .delete(`/membership-pauses/${membershipPause.id}?client=${testClientId}`)
      .use(authorizeUserAlice())
      .expect(403);

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: membershipPause.id});
  });

  it('should return notFound', async () => {

    const membership = await Membership.create({
      client: testClientId,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      paid_until: '2020-05-31',
      status: 'active',
      user: fixtures.userAlice.id,
    }).fetch();

    const membershipPause = await MembershipPause.create({
      client_id: testClientId,
      membership_id: membership.id,
      start_date: '2020-06-01',
      archived: true,
    }).fetch();

    await supertest(sails.hooks.http.app)
      .delete(`/membership-pauses/${membershipPause.id}?client=${testClientId}`)
      .use(authorizeAdmin())
      .expect(404);

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: membershipPause.id});

  });

  it('should fail if not deleting the last membership pause', async () => {

    const membership = await Membership.create({
      client: testClientId,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      paid_until: '2020-05-31',
      status: 'ended',
    }).fetch();

    const membershipPauses = await MembershipPause.createEach([
      {
        client_id: testClientId,
        membership_id: membership.id,
        start_date: '2020-05-01',
        end_date: '2020-05-15',
      },
      {
        client_id: testClientId,
        membership_id: membership.id,
        start_date: '2020-06-10',
        end_date: '2020-06-20',
      },
    ]).fetch();

    const {body: errorResponse} = await supertest(sails.hooks.http.app)
      .delete(`/membership-pauses/${membershipPauses[0].id}?client=${testClientId}`)
      .use(acceptExtendedErrorFormat())
      .use(authorizeAdmin())
      .expect(200);

    expect(errorResponse).to.matchPattern({
      error: {
        type: 'OnlyTheLastMembershipPauseCanBeRemoved',
        localized_title: 'Membership pause can not be removed',
        localized_message: 'Only the last membership pause can be removed',
      },
    });

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: _.map(membershipPauses, 'id')});

  });

  it('should fail if membership pause has ended', async () => {

    const membership = await Membership.create({
      client: testClientId,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      paid_until: '2020-05-31',
      status: 'active',
    }).fetch();

    const membershipPause = await MembershipPause.create({
      client_id: testClientId,
      membership_id: membership.id,
      start_date: '2020-05-01',
      end_date: '2020-05-15',
    }).fetch();

    MockDate.set(moment.tz('2020-05-31', 'Europe/Copenhagen'));
    const {body: errorResponse} = await supertest(sails.hooks.http.app)
      .delete(`/membership-pauses/${membershipPause.id}?client=${testClientId}`)
      .use(acceptExtendedErrorFormat())
      .use(authorizeAdmin())
      .expect(200);

    expect(errorResponse).to.matchPattern({
      error: {
        type: 'MembershipPauseHasEndedAndCanNotBeRemoved',
        localized_title: 'Pause has ended',
        localized_message: 'A Membership pause that has ended can not be removed.',
      },
    });

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: membershipPause.id});

  });

  it('should fail if removal will result in a payment date more than 28 days before today', async () => {

    const membership = await Membership.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      paid_until: '2020-03-31',
      status: 'active',
    }).fetch();

    const membershipPause = await MembershipPause.create({
      client_id: testClientId,
      membership_id: membership.id,
      start_date: '2020-03-01',
      end_date: '2020-07-01',
    }).fetch();

    MockDate.set(moment.tz('2020-06-01', 'Europe/Copenhagen'));
    const {body: errorResponse} = await supertest(sails.hooks.http.app)
      .delete(`/membership-pauses/${membershipPause.id}?client=${testClientId}`)
      .use(acceptExtendedErrorFormat())
      .use(authorizeAdmin())
      .expect(200);

    expect(errorResponse).to.matchPattern({
      error: {
        type: 'CantRemoveMembershipPauseBecausePaymentDateIsTooEarly',
        localized_title: 'New payment date is too early',
        localized_message: 'Membership pause can not be removed because it would result in a too early payment date and might cause multiple automatic payments.',
      },
    });

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: membershipPause.id});

  });



  it('should remove the membership pause', async () => {

    const membership = await Membership.create({
      client: testClientId,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      user: fixtures.userAlice.id,
      paid_until: '2020-05-31',
      status: 'active',
    }).fetch();

    const membershipPause = await MembershipPause.create({
      client_id: testClientId,
      membership_id: membership.id,
      start_date: '2020-05-05',
      end_date: '2020-06-05',
      fee: 0,
    }).fetch();


    MockDate.set(moment.tz('2020-05-15', 'Europe/Copenhagen'));
    await supertest(sails.hooks.http.app)
      .delete(`/membership-pauses/${membershipPause.id}?client=${testClientId}`)
      .use(acceptExtendedErrorFormat())
      .use(authorizeAdmin())
      .expect(200);


    const MembershipPauseObjection = require('../../../../api/objection-models/MembershipPause');
    const updatedMembershipPause = await MembershipPauseObjection.query().findById(membershipPause.id);

    expect(updatedMembershipPause).to.matchPattern(`{
      membership_id: ${membership.id},
      start_date: '2020-05-05',
      end_date: '2020-06-05',
      archived: 1,
      ...
    }`);


    const logEntries = await MembershipLog.find({});
    expect(logEntries).to.matchPattern(`[    
    {
      client: ${testClientId},
      membership: ${membership.id},
      entry: 'Membership pause removed. Admin user: Admin Adminson.',
      ...
    }
    ]`);

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: membershipPause.id});
  });

});
