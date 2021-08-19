module.exports = {

  friendlyName: 'Lock a membership for processing',

  description: 'Lock the membership so we can fetch payments or do other stuff without getting a race condition.',

  inputs: {
    membership: {
      type: 'ref',
      required: true,
    },
  },

  exits: {
    success: {
      responseType: 'ref',
      description: 'The locked membership',
    },
    processingAlreadyStarted: {
      description: `Membership already has the field 'auto_payment_processing_started' set.`,
    },

  },

  fn: async (inputs, exits) => {

    const membershipId = sails.helpers.util.idOrObjectIdInteger(inputs.membership)

    await sails.helpers.cron.log(`About to set lock on membership with id ${membershipId}`)


    const transactionResult = await sails.getDatastore().transaction(async (dbConnection, proceed) => {

      // Lock the membership record. Other connections are not allowed to go past this line before the lock is released.
      const lockedMembership = (
        await sails.sendNativeQuery(
          `SELECT * FROM membership WHERE id = ${membershipId} FOR UPDATE`,
        )
          .usingConnection(dbConnection)
      ).rows[0]

      if (lockedMembership.automatic_payment_processing_started) {
        await sails.helpers.cron.log(`Cannot set lock. Membership already locked at timestamp ${lockedMembership.automatic_payment_processing_started}`)
        throw 'processingAlreadyStarted'
      }


      const updatedMembership = (
        await Membership.update(
          {
            id: lockedMembership.id,
          }, {
            automatic_payment_processing_started: Date.now(),
          },
        ).usingConnection(dbConnection).fetch()
      )[0]

      await sails.helpers.cron.log(`Lock was succesfully set on membership id ${updatedMembership.id}.`)

      return proceed(null, updatedMembership)

    })


    return exits.success(transactionResult)

  },

}
