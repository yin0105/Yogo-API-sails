const assert = require('assert')

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID
const fixtures = require('../../../fixtures/factory').fixtures

describe('helpers.memberships.releaseProcessingLock', async function () {

  it('should release processing lock', async () => {

    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2018-05-15',
      client: testClientId,
      status: 'active',
      automatic_payment_processing_started: Date.now(),
    }).fetch()

    const membership2 = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2018-05-15',
      client: testClientId,
      status: 'active',
      automatic_payment_processing_started: Date.now(),
    }).fetch()

    await sails.helpers.memberships.releaseProcessingLock(membership)

    const dbMembership = await Membership.findOne(membership.id)

    assert.equal(
      dbMembership.automatic_payment_processing_started,
      0,
    )

    const dbMembership2 = await Membership.findOne(membership2.id)

    // Should leave other memberships untouched, of course
    assert.equal(
      dbMembership2.automatic_payment_processing_started,
      membership2.automatic_payment_processing_started,
    )

    await Membership.destroy({
      id: [membership.id, membership2.id],
    })

  })

  it('should accept membership ID as well as membership object', async () => {

    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2018-05-15',
      client: testClientId,
      status: 'active',
      automatic_payment_processing_started: Date.now(),
    }).fetch()

    await sails.helpers.memberships.releaseProcessingLock(membership.id)

    const dbMembership = await Membership.findOne(membership.id)

    assert.equal(
      dbMembership.automatic_payment_processing_started,
      0,
    )

    await Membership.destroy({
      id: membership.id,
    })

  })


})
