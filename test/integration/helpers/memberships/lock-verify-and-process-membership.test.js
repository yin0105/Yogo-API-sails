const assert = require('assert')

const fixtures = require('../../../fixtures/factory').fixtures


describe('helpers.memberships.lock-verify-and-process-membership', async () => {

  let membership

  before(async () => {
    membership = await Membership.create({
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      user: fixtures.userAlice.id,
    }).fetch()
  })

  after(async () => {
    await Membership.destroy({id: membership.id})
  })

  it('should prevent other threads from accessing membership before it has set automatic_payment_processing_started', (done) => {

    let membershipHasBeenTestedWithRowLocked = false

    sails.helpers.memberships.lockVerifyAndProcessMembership(
      membership, // Membership to process
      async function () { // testIfMembershipShouldStillBeProcessedFunction
        membershipHasBeenTestedWithRowLocked = true
        return true
      },
      async function () { // membershipProcessingFunction
        const m = await Membership.findOne(membership.id)
        assert(m.automatic_payment_processing_started > 0)
        return true
      },
    ).then(async membershipWasProcessed => {
      assert.strictEqual(membershipWasProcessed, true)
      const m = await Membership.findOne(membership.id)
      assert.strictEqual(m.automatic_payment_processing_started, 0)
      done()
    })


    assert.strictEqual(membershipHasBeenTestedWithRowLocked, false)

    sails.helpers.memberships.lockVerifyAndProcessMembership(
      membership,
      async function () { // testIfMembershipShouldStillBeProcessedFunction
        // Should never come here
        // assert(false)
      },
      async function () { // membershipProcessingFunction
        // Should never come here
        // assert(false)
      },
    ).then(async membershipWasProcessed => {
      assert.strictEqual(membershipWasProcessed, false)
    })

  })

  it('should process membership if testIfMembershipShouldStillBeProcessedFunction returns true', async () => {

    let membershipHasBeenProcessed = false

    const membershipWasProcessed = await sails.helpers.memberships.lockVerifyAndProcessMembership(
      membership,
      async function () {
        return true
      },
      async function () {
        membershipHasBeenProcessed = true
        return true
      },
    )

    assert.strictEqual(membershipWasProcessed, true)
    assert.strictEqual(membershipHasBeenProcessed, true)

  })

  it('should not process membership if shouldStillProcessMembership returns false', async () => {

    let membershipHasBeenProcessed = false

    const membershipHasBeenLocked = await sails.helpers.memberships.lockVerifyAndProcessMembership(
      membership,
      async function () {
        return false
      },
      async function () {
        membershipHasBeenProcessed = true
      },
    )

    assert(membershipHasBeenLocked === false)
    assert(membershipHasBeenProcessed === false)

  })

  it('should not process membership if membership is currently being processed', async () => {
    await Membership.update({id: membership.id}, {automatic_payment_processing_started: 1}).fetch()

    let membershipHasBeenProcessed = false

    const membershipHasBeenLocked = await sails.helpers.memberships.lockVerifyAndProcessMembership(
      membership,
      async function () {
        return true
      },
      async function () {
        membershipHasBeenProcessed = true
      },
    )

    assert(membershipHasBeenLocked === false)
    assert(membershipHasBeenProcessed === false)

    await Membership.update({id: membership.id}, {automatic_payment_processing_started: 0})

  })

})
