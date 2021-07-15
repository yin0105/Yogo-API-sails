module.exports = {

  friendlyName: 'Get locked row for update',

  description: 'Lock the record. Other connections are not allowed to go past this helper then. There needs to be an active transaction for this to work.',

  inputs: {

    membership: {
      type: 'ref',
      required: true,
    },

    testIfMembershipShouldStillBeProcessedFunction: {
      type: 'ref',
      description: "If this callback returns false, end transaction and don't set processing lock.",
      required: true,
    },

    membershipProcessingFunction: {
      type: 'ref',
      description: 'The callback to call when the processing lock is set',
      required: true,
    },

  },

  exits: {
    success: {
      outputFriendlyName: 'Boolean: Membership was processed',
    }
  },

  fn: async (inputs, exits) => {


    const cronLog = sails.helpers.cron.log

    const membershipId = sails.helpers.util.idOrObjectIdInteger(inputs.membership)

    await cronLog('About to start transaction for locking membership id ' + membershipId)

    const membershipHasBeenLocked = await sails.getDatastore().transaction(async (dbConnection, proceed) => {

      const lockRowResult = await sails.sendNativeQuery(
        `SELECT * FROM membership WHERE id = ${membershipId} FOR UPDATE`,
      ).usingConnection(dbConnection)

      if (lockRowResult.rows.length !== 1) {
        await cronLog('Membership ' + membershipId + ' not found in db')
        throw new Error('Membership not found in db')
      }

      const row = lockRowResult.rows[0]

      await cronLog('Row locked on membership id ' + membershipId)

      if (row.automatic_payment_processing_started > 0) {
        await cronLog(`Automatic payment already running on membership with id ${membershipId}`)
        return proceed(null, false)
      }

      const membershipShouldStillBeProcessed = await inputs.testIfMembershipShouldStillBeProcessedFunction(row, dbConnection)
      await cronLog('membershipShouldStillBeProcessed: ' + membershipShouldStillBeProcessed)

      if (!membershipShouldStillBeProcessed) {
        return proceed(null, false)
      }

      await sails.sendNativeQuery(
        `UPDATE membership SET automatic_payment_processing_started = UNIX_TIMESTAMP() * 1000 WHERE id = ${membershipId}`,
      ).usingConnection(dbConnection)

      return proceed(null, true)

    })


    if (!membershipHasBeenLocked) {
      await cronLog('Membership could not be locked for processing')
      return exits.success(false)
    }

    /*************************/

    await cronLog('About to process membership ' + membershipId)
    const processingResult = await inputs.membershipProcessingFunction(membershipId)
    await cronLog('Processing result for membership ' + membershipId + ': ' + processingResult)

    /************************/


    // Unlock membership
    await cronLog(`Membership ${membershipId} processed. About to unlock it.`)
    await Membership.update({id: membershipId}, {automatic_payment_processing_started: false})
    await cronLog('Did unlock membership ' + membershipId)

    return exits.success(true)

  },
}
