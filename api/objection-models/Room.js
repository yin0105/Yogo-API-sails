const {Model} = require('objection')
const knex = require('../services/knex')
Model.knex(knex)

class Room extends Model {

  static get tableName () {
    return 'room'
  }

  static get relationMappings() {
    const Branch = require('./Branch')

    return {
      branch: {
        relation: Model.BelongsToOneRelation,
        modelClass: Branch,
        join: {
          from: 'room.branch',
          to: 'branch.id'
        }
      },
    }
  }

  $parseDatabaseJson(json) {
    // Remember to call the super class's implementation.
    json = super.$parseDatabaseJson(json);

    // Do your conversion here.
    if (typeof json.branch !== 'undefined') {
      json.branch_id = json.branch
      delete json.branch
    }

    return json;
  }

}

module.exports = Room
