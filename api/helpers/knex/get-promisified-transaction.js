const knex = require('../../services/knex')

module.exports = {
  friendlyName: 'Get promisified Knex transaction',

  fn: async (inputs, exits) => {

    const promisify = (fn) => new Promise((resolve, reject) => fn(resolve))

    return exits.success(
      await promisify(knex.transaction),
    )

  },
}
