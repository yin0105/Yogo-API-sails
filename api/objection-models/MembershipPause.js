const {Model} = require('objection');
const knex = require('./knex-config');
Model.knex(knex);
const moment = require('moment-timezone');

class MembershipPause extends Model {

  static get tableName() {
    return 'membership_pause';
  }

  static get relationMappings() {
    const Membership = require('./Membership');
    const Client = require('./Client');

    return {
      membership: {
        relation: Model.BelongsToOneRelation,
        modelClass: Membership,
        join: {
          from: 'membership_pause.membership_id',
          to: 'membership.id',
        },
      },
      client: {
        relation: Model.BelongsToOneRelation,
        modelClass: Client,
        join: {
          from: 'membership_pause.client_id',
          to: 'client.id',
        },
      }
    };

  }

  $parseDatabaseJson(json) {
    // Remember to call the super class's implementation.
    json = super.$parseDatabaseJson(json);

    if (json.start_date) {
      json.start_date = moment(json.start_date).format('YYYY-MM-DD');
    }

    if (json.end_date) {
      json.end_date = moment(json.end_date).format('YYYY-MM-DD');
    }

    return json;
  }


}

module.exports = MembershipPause;
