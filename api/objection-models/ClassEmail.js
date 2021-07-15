const {Model} = require('objection');
const knex = require('../services/knex');
Model.knex(knex);
const moment = require('moment-timezone');

class ClassEmail extends Model {

  static get tableName() {
    return 'class_email';
  }

  static get relationMappings() {
    const User = require('./User');
    const Client = require('./Client');
    const ClassEmailInstance = require('./ClassEmailInstance');
    const Class = require('./Class');

    return {
      client: {
        relation: Model.BelongsToOneRelation,
        modelClass: Client,
        join: {
          from: 'class_email.client_id',
          to: 'client.id',
        },
      },
      sender: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'class_email.sender_id',
          to: 'user.id',
        },
      },
      instances: {
        relation: Model.HasManyRelation,
        modelClass: ClassEmailInstance,
        join: {
          from: 'class_email.id',
          to: 'class_email_instance.class_email_id',
        },
      },
      class: {
        relation: Model.BelongsToOneRelation,
        modelClass: Class,
        join: {
          from: 'class_email.class_id',
          to: 'class.id',
        },
      },
    };
  }

  $parseDatabaseJson(json) {
    // Remember to call the super class's implementation.
    json = super.$parseDatabaseJson(json);

    if (json.send_at_datetime) {
      // Datetime is without timezone, but it is returned as UTC. So we just discard the timezone info.
      json.send_at_datetime = moment.tz(json.send_at_datetime, 'UTC').format('YYYY-MM-DD HH:mm:ss');
    }

    if (typeof json.send_to_signups !== 'undefined') {
      json.send_to_signups = !!json.send_to_signups;
    }

    if (typeof json.send_to_waiting_list !== 'undefined') {
      json.send_to_waiting_list = !!json.send_to_waiting_list;
    }

    if (typeof json.send_to_livestream_signups !== 'undefined') {
      json.send_to_livestream_signups = !!json.send_to_livestream_signups;
    }

    if (typeof json.send_to_subsequent_signups !== 'undefined') {
      json.send_to_subsequent_signups = !!json.send_to_subsequent_signups;
    }

    if (typeof json.email_sent !== 'undefined') {
      json.email_sent = !!json.email_sent;
    }

    if (typeof json.now_processing !== 'undefined') {
      json.now_processing = !!json.now_processing;
    }

    return json;
  }

}

module.exports = ClassEmail;
