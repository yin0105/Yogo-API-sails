const Knex = require('knex')

const connectionDetails = sails.config.datastores.default.url.match(/mysql:\/\/(\w+):([\w\d]+)@([\w\d.-]+)\/(\w+)/)

module.exports = Knex({
  client: 'mysql',
  connection: {
    user: connectionDetails[1],
    password: connectionDetails[2],
    host: connectionDetails[3],
    database: connectionDetails[4],
    charset: 'utf8mb4',
    timezone: 'utc'
  },
  pool: {min: 2, max: 4},
})
