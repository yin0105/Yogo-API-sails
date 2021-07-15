const {Model} = require('objection')
const knex = require('./knex-config')
Model.knex(knex)

class MembershipCampaign extends Model {

  static get tableName() {
    return 'membership_campaign'
  }

  static get relationMappings() {
    const MembershipType = require('./MembershipType')

    return {
      membership_type: {
        relation: Model.BelongsToOneRelation,
        modelClass: MembershipType,
        join: {
          from: 'membership_campaign.membership_type',
          to: 'membership_type.id',
        },
      },
    }
  }

  $parseDatabaseJson(json) {
    // Remember to call the super class's implementation.
    json = super.$parseDatabaseJson(json)

    if (typeof json.membership_type !== 'undefined') {
      json.membership_type_id = json.membership_type
      delete json.membership_type
    }

    return json
  }

  $formatDatabaseJson(json) {
    json = super.$formatDatabaseJson(json)

    if (typeof json.membership_type_id !== 'undefined') {
      json.membership_type = json.membership_type_id
      delete json.membership_type_id
    }

    return json

  }

}

module.exports = MembershipCampaign
