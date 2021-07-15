const {Model} = require('objection')
const knex = require('../services/knex')
Model.knex(knex)

class Branch extends Model {

  static get tableName () {
    return 'branch'
  }

}

module.exports = Branch
