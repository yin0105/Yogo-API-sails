const {Model} = require('objection');
const knex = require('../services/knex');
Model.knex(knex);
const BaseClass = require('./BaseClass')

class ClassTypeEmail extends BaseClass {

  static get tableName() {
    return 'class_type_email';
  }

  static get relationMappings() {

    const Client = require('./Client');
    const ClassType = require('./ClassType');

    return {
      client: {
        relation: Model.BelongsToOneRelation,
        modelClass: Client,
        join: {
          from: 'class_type_email.client_id',
          to: 'client.id',
        },
      },
      class_types: {
        relation: Model.ManyToManyRelation,
        modelClass: ClassType,
        join: {
          from: 'class_type_email.id',
          through: {
            from: 'class_type_email_class_type.class_type_email_id',
            to: 'class_type_email_class_type.class_type_id',
          },
          to: 'class_type.id',
        }
      }
    };
  }

  $parseDatabaseJson(json) {
    // Remember to call the super class's implementation.
    json = super.$parseDatabaseJson(json);

    if (typeof json.send_to_signups !== 'undefined') {
      json.send_to_signups = !!json.send_to_signups
    }
    if (typeof json.send_to_livestream_signups !== 'undefined') {
      json.send_to_livestream_signups = !!json.send_to_livestream_signups
    }
    if (typeof json.send_to_waiting_list !== 'undefined') {
      json.send_to_waiting_list = !!json.send_to_waiting_list
    }
    if (typeof json.send_to_subsequent_signups !== 'undefined') {
      json.send_to_subsequent_signups = !!json.send_to_subsequent_signups
    }


    return json;
  }

}

module.exports = ClassTypeEmail;
