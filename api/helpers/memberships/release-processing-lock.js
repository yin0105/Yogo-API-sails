const knex = require('../../services/knex')

module.exports = {

  friendlyName: 'Release locked membership',

  description: 'Set the field automatic_payment_processing_started to 0, meaning that no automatic processing is currently running.',

  inputs: {
    membership: {
      type: 'ref',
      description: 'The membership to release lock on. Can be ID or object.',
      required: true,
    },
  },

  fn: async (inputs, exits) => {
    const membershipId = sails.helpers.util.idOrObjectIdInteger(inputs.membership)
    await sails.helpers.cron.log(`About to release lock on membership with id ${membershipId}`)

    await knex('membership')
      .update({
        automatic_payment_processing_started: 0,
      })
      .where('id', membershipId)

    await sails.helpers.cron.log(`Lock was succesfully removed on membership id ${membershipId}.`)

    return exits.success()
  }

}
