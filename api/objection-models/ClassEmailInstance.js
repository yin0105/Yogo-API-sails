const {Model} = require('objection');
const knex = require('../services/knex');
Model.knex(knex);

class ClassEmailInstance extends Model {

  static get tableName() {
    return 'class_email_instance';
  }

  static get relationMappings() {
    const User = require('./User');
    const Client = require('./Client');
    const ClassEmail = require('./ClassEmail');

    return {
      client: {
        relation: Model.BelongsToOneRelation,
        modelClass: Client,
        join: {
          from: 'class_email_instance.client_id',
          to: 'client.id',
        },
      },
      class_email: {
        relation: Model.BelongsToOneRelation,
        modelClass: ClassEmail,
        join: {
          from: 'class_email_instance.class_email_id',
          to: 'class_email.id',
        },
      },
      recipient: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'class_email_instance.recipient_id',
          to: 'user.id',
        },
      },
    };
  }

}

module.exports = ClassEmailInstance;
