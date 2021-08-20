const assert = require('assert')
const moment = require('moment-timezone')

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID
const fixtures = require('../../../fixtures/factory').fixtures

const MockDate = require('mockdate')

describe('helpers.memberships.membership-payment-should-still-be-processed', async () => {

  beforeEach(async () => {
    await ClientSettings.destroy({});
    await Membership.destroy({});
  })

  before(async () => {
    MockDate.set(moment.tz('2019-05-16 12:00:00', 'Europe/Copenhagen'))
  })

  after(async () => {
    MockDate.reset()
  })


  it('should return true if membership is active and not paid', async () => {

    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2019-05-15',
      client: testClientId,
      status: 'active',
    }).fetch()

    await sails.getDatastore().transaction(async (dbConnection, proceed) => {

      assert.strictEqual(
        await sails.helpers.memberships.membershipPaymentShouldStillBeProcessed(membership, dbConnection),
        true,
      )
      proceed()
    })

    await Membership.destroy({id: membership.id})
  })


  it('should return false if renewal failed once and less than 3 days have passed', async () => {
    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2019-05-15',
      client: testClientId,
      renewal_failed: 1,
      status: 'active',
    }).fetch()

    await sails.getDatastore().transaction(async (dbConnection, proceed) => {
      assert.strictEqual(
        await sails.helpers.memberships.membershipPaymentShouldStillBeProcessed(membership, dbConnection),
        false,
      )
      proceed()
    })

    await Membership.destroy({id: membership.id})
  })



  it('should return true if renewal failed once and 3 days (default) have passed', async () => {
    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2019-05-12',
      client: testClientId,
      renewal_failed: 1,
      status: 'active',
    }).fetch()

    MockDate.set(moment.tz('2019-05-16 00:00:00', 'Europe/Copenhagen'))

    await sails.getDatastore().transaction(async (dbConnection, proceed) => {
      assert.strictEqual(
        await sails.helpers.memberships.membershipPaymentShouldStillBeProcessed(membership, dbConnection),
        true,
      )
      proceed()
    })

    await Membership.destroy({id: membership.id})
  })



  it('should return false if renewal failed twice and less than 6 days (default) have passed', async () => {
    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2019-05-11',
      client: testClientId,
      renewal_failed: 2,
      status: 'active',
    }).fetch()

    await sails.getDatastore().transaction(async (dbConnection, proceed) => {
      assert.strictEqual(
        await sails.helpers.memberships.membershipPaymentShouldStillBeProcessed(membership, dbConnection),
        false,
      )
      proceed()
    })

    await Membership.destroy({id: membership.id})
  })



  it('should return true if renewal failed twice and 6 days (default) have passed', async () => {
    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2019-05-09',
      client: testClientId,
      renewal_failed: 2,
      status: 'active',
      renewal_failed_last_time_at: moment.tz('2019-05-15 00:00:00', 'Europe/Copenhagen').format('x'),
    }).fetch();

    await sails.getDatastore().transaction(async (dbConnection, proceed) => {
      assert.strictEqual(
        await sails.helpers.memberships.membershipPaymentShouldStillBeProcessed(membership, dbConnection),
        true,
      )
      proceed()
    })

    await Membership.destroy({id: membership.id})
  })




  it('should return false if renewal failed twice and 6 days have passed, but it is less than 24 hours since last try', async () => {
    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2019-05-09',
      client: testClientId,
      renewal_failed: 2,
      status: 'active',
      renewal_failed_last_time_at: moment.tz('2019-05-15 12:30:00', 'Europe/Copenhagen').format('x'),
    }).fetch()

    await sails.getDatastore().transaction(async (dbConnection, proceed) => {
      assert.strictEqual(
        await sails.helpers.memberships.membershipPaymentShouldStillBeProcessed(membership, dbConnection),
        false,
      )
      proceed()
    })

    await Membership.destroy({id: membership.id})
  })



  it('should return true if renewal failed 3 times and 9 days (default) have passed', async () => {
    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2019-05-06',
      client: testClientId,
      renewal_failed: 3,
      status: 'active',
    }).fetch()

    await sails.getDatastore().transaction(async (dbConnection, proceed) => {
      assert.strictEqual(
        await sails.helpers.memberships.membershipPaymentShouldStillBeProcessed(membership, dbConnection),
        true,
      )
      proceed()
    })

    await Membership.destroy({id: membership.id})
  })

  it('should return false if renewal failed 4 times and less than 10 days (default) have passed', async () => {
    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2019-05-06',
      client: testClientId,
      renewal_failed: 4,
      status: 'active',
    }).fetch()

    await sails.getDatastore().transaction(async (dbConnection, proceed) => {
      assert.strictEqual(
        await sails.helpers.memberships.membershipPaymentShouldStillBeProcessed(membership, dbConnection),
        false,
      )
      proceed()
    })

    await Membership.destroy({id: membership.id})
  })

  it('should return true if renewal failed 4 times and 10 days (default) have passed', async () => {
    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2019-05-05',
      client: testClientId,
      renewal_failed: 4,
      status: 'active',
    }).fetch()

    await sails.getDatastore().transaction(async (dbConnection, proceed) => {
      assert.strictEqual(
        await sails.helpers.memberships.membershipPaymentShouldStillBeProcessed(membership, dbConnection),
        true,
      )
      proceed()
    })

    await Membership.destroy({id: membership.id})
  })



  it('should return false if renewal failed 5 times and membership is ended', async () => {
    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2019-05-02',
      client: testClientId,
      renewal_failed: 5,
      status: 'ended',
    }).fetch()

    await sails.getDatastore().transaction(async (dbConnection, proceed) => {
      assert.strictEqual(
        await sails.helpers.memberships.membershipPaymentShouldStillBeProcessed(membership, dbConnection),
        false,
      )
      proceed()
    })

    await Membership.destroy({id: membership.id})
  })



  it('should return true if status is cancelled_running', async () => {
    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2019-05-04',
      cancelled_from_date: '2019-06-05',
      client: testClientId,
      renewal_failed: 0,
      status: 'cancelled_running',
    }).fetch()

    await sails.getDatastore().transaction(async (dbConnection, proceed) => {
      assert.strictEqual(
        await sails.helpers.memberships.membershipPaymentShouldStillBeProcessed(membership, dbConnection),
        true,
      )
      proceed()
    })

    await Membership.destroy({id: membership.id})
  })

  it('should return false if cancelled membership is expired', async () => {
    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2019-05-15',
      cancelled_from_date: '2019-05-16',
      client: testClientId,
      renewal_failed: 0,
      status: 'cancelled_running',
    }).fetch()

    await sails.getDatastore().transaction(async (dbConnection, proceed) => {
      assert.strictEqual(
        await sails.helpers.memberships.membershipPaymentShouldStillBeProcessed(membership, dbConnection),
        false,
      )
      proceed()
    })

    await Membership.destroy({id: membership.id})
  })




  it('should return false if membership is ended', async () => {
    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2019-03-01',
      client: testClientId,
      status: 'ended',
    }).fetch()

    await sails.getDatastore().transaction(async (dbConnection, proceed) => {
      assert.strictEqual(
        await sails.helpers.memberships.membershipPaymentShouldStillBeProcessed(membership, dbConnection),
        false,
      )
      proceed()
    })

    await Membership.destroy({id: membership.id})
  })

  it('should return false is membership is archived', async () => {
    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2019-05-15',
      client: testClientId,
      status: 'active',
      archived: true,
    }).fetch()

    await sails.getDatastore().transaction(async (dbConnection, proceed) => {
      assert.strictEqual(
        await sails.helpers.memberships.membershipPaymentShouldStillBeProcessed(membership, dbConnection),
        false,
      )
      proceed()
    })

    await Membership.destroy({id: membership.id})
  })

  it('should return false if membership is already being processed', async () => {
    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2019-05-15',
      client: testClientId,
      status: 'active',
      automatic_payment_processing_started: '123456789',
    }).fetch()

    await sails.getDatastore().transaction(async (dbConnection, proceed) => {
      assert.strictEqual(
        await sails.helpers.memberships.membershipPaymentShouldStillBeProcessed(membership, dbConnection),
        false,
      )
      proceed()
    })

    await Membership.destroy({id: membership.id})
  })

  it('should return false if there is a membership pause for today with a set end date', async () => {
    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2019-05-15',
      client: testClientId,
      status: 'active',
    }).fetch();

    const membershipPause = await MembershipPause.create({
      client_id: testClientId,
      membership_id: membership.id,
      start_date: '2019-05-16',
      end_date: '2019-05-17'
    }).fetch();

    await sails.getDatastore().transaction(async (dbConnection, proceed) => {
      assert.strictEqual(
        await sails.helpers.memberships.membershipPaymentShouldStillBeProcessed(membership, dbConnection),
        false,
      )
      proceed()
    })

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: membershipPause.id});
  })

  it('should return false if there is a membership pause for today without an end date', async () => {
    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2019-05-15',
      client: testClientId,
      status: 'active',
    }).fetch();

    const membershipPause = await MembershipPause.create({
      client_id: testClientId,
      membership_id: membership.id,
      start_date: '2019-05-16',
    }).fetch();

    await sails.getDatastore().transaction(async (dbConnection, proceed) => {
      assert.strictEqual(
        await sails.helpers.memberships.membershipPaymentShouldStillBeProcessed(membership, dbConnection),
        false,
      )
      proceed()
    })

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: membershipPause.id});
  })

  it('should return true if there is no membership pause that covers today', async () => {
    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2019-05-15',
      client: testClientId,
      status: 'active',
    }).fetch();

    const membershipPauses = await MembershipPause.createEach([{
      client_id: testClientId,
      membership_id: membership.id,
      start_date: '2019-05-15',
      end_date: '2019-05-16'
    },
      {
        client_id: testClientId,
        membership_id: membership.id,
        start_date: '2019-05-17',
      }
      ]).fetch();

    await sails.getDatastore().transaction(async (dbConnection, proceed) => {
      assert.strictEqual(
        await sails.helpers.memberships.membershipPaymentShouldStillBeProcessed(membership, dbConnection),
        true,
      )
      proceed()
    })

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: _.map(membershipPauses, 'id')});
  })

})
