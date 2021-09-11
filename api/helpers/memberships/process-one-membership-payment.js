module.exports = {

  friendlyName: 'Process one membership payment.',

  description: `
  Checks if there is a membership where an auto-payment should be processed.
  
  Returns the membership that was processed, false if none was processed.
  `,


  fn: async (inputs, exits) => {

    const cronLog = sails.helpers.cron.log

    await cronLog(
      'About to look for memberships that need to process payment',
    )

    const membershipThatNeedsToProcessPayment = await sails.helpers.memberships.findOne.thatNeedsToProcessPayment()

    if (!membershipThatNeedsToProcessPayment) {
      await cronLog(
        'Found no memberships that need to process payment',
      )
      return exits.success(false)
    }

    console.log(" process => 2")
    await cronLog(
      'Found membership that needs to process payment now: ' + membershipThatNeedsToProcessPayment.id,
      membershipThatNeedsToProcessPayment.client,
    )

    const membershipWasProcessed = await sails.helpers.memberships.lockVerifyAndProcessMembership.with({

      membership: membershipThatNeedsToProcessPayment,

      testIfMembershipShouldStillBeProcessedFunction: sails.helpers.memberships.membershipPaymentShouldStillBeProcessed,

      membershipProcessingFunction: sails.helpers.memberships.fetchMembershipPayment,

    })


    return exits.success(membershipWasProcessed ? membershipThatNeedsToProcessPayment.id : false)

  },

}
