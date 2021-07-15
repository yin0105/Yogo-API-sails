const {Model} = require('objection')
const knex = require('../services/knex')
Model.knex(knex)

class BaseClass extends Model {
  $beforeInsert() {
    this.createdAt = Date.now();
    this.updatedAt = this.createdAt;
    this.archived = 0;
  }

  $beforeUpdate() {
    this.updatedAt = Date.now()
  }
}

module.exports = BaseClass
