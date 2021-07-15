/**
 * CronController.log
 *
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {

  friendlyName: 'Cron log from webapp',

  inputs: {
    entry: {
      type: 'string',
      description: 'The entry to log',
      required: true
    }
  },


  fn: async function (inputs, exits) {

    if (!await sails.helpers.can2('controller.Cron.log', this.req)) {
      return this.res.forbidden()
    }

    await sails.helpers.cron.log.with({
      entry: inputs.entry,
      client: this.req.client
    })

    return exits.success()

  }

}
