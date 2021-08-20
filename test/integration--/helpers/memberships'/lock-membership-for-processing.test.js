const assert = require('assert')

const assertAsyncThrows = require('../../../utils/assert-async-throws')
const assertAsyncDbObject = require('../../../utils/assert-async-db-object')

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID
const fixtures = require('../../../fixtures/factory').fixtures

const MockDate = require('mockdate')

describe('helpers.memberships.lockMembershipForProcessing', async function () {

  it('should set processing flag to current timestamp', async () => {

    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2018-05-15',
      client: testClientId,
      status: 'active',
    }).fetch()

    const lockedMembership = await sails.helpers.memberships.lockMembershipForProcessing(membership)

    assert.equal(
      lockedMembership.id,
      membership.id,
    )

    const now = new Date().getTime()

    assert(
      lockedMembership.automatic_payment_processing_started < now + 1000 && lockedMembership.automatic_payment_processing_started > now - 1000,
    )

    await Membership.destroy({
      id: membership.id,
    })

  })

  it('should accept membership ID as well as membership object', async () => {

    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2018-05-15',
      client: testClientId,
      status: 'active',
    }).fetch()

    const lockedMembership = await sails.helpers.memberships.lockMembershipForProcessing(membership.id)

    assert.equal(
      lockedMembership.id,
      membership.id,
    )

    const now = Date.now()

    assert(
      lockedMembership.automatic_payment_processing_started < now + 1000 && lockedMembership.automatic_payment_processing_started > now - 1000,
      'Locked membership has wrong timestamp.',
    )

    await Membership.destroy({
      id: membership.id,
    })

  })


  it('should throw if processing lock is already set', async () => {

    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2018-05-15',
      client: testClientId,
      status: 'active',
    }).fetch()

    await sails.helpers.memberships.lockMembershipForProcessing(membership)

    await assertAsyncThrows(
      async () => {
        await sails.helpers.memberships.lockMembershipForProcessing(membership)
      },
      'processingAlreadyStarted',
    )

    await Membership.destroy({
      id: membership.id,
    })

  })


  it('should handle two requests made at the same time', async () => {

    const membership = await Membership.create({
      user: fixtures.userAlice.id,
      paid_until: '2018-05-15',
      client: testClientId,
      status: 'active',
    }).fetch()


    await new Promise((resolve, reject) => {

      const failTimeout = setTimeout(() => {
        reject('Timeout')
      }, 2000)

      let locksDone = 0

      function lockDone() {
        locksDone++
        if (locksDone >= 2) {
          clearTimeout(failTimeout)
          resolve()
        }
      }

      sails.helpers.memberships.lockMembershipForProcessing(membership)
        .then(lockedMembership => {
          const now = Date.now()
          assert(
            lockedMembership.automatic_payment_processing_started < now + 1000 && lockedMembership.automatic_payment_processing_started > now - 1000,
            'Locked membership has wrong timestamp.',
          )
          lockDone()
        })
        .catch(e => {
          reject('First lock request failed')
        })

      sails.helpers.memberships.lockMembershipForProcessing(membership)
        .then(() => {
          reject('Error: Second lock request succeeded.')
        })
        .catch(e => {
          assert(
            e.code,
            'processingAlreadyStarted',
          )
          lockDone()
        })
    })

    await Membership.destroy({
      id: membership.id,
    })

  })


})
