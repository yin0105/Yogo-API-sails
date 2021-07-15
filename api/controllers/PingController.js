/**
 * PingController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {

  ping: async function (req, res) {

    // Make sure we have a working db connection
    const clients = await Client.find().limit(1)

    if (!clients || !_.isArray(clients)) {
      return res.serverError('Database connection error')
    }

    return res.ok('Yogo API')

  },

}

