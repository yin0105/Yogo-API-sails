const {Model} = require('objection');
const knex = require('../services/knex');
Model.knex(knex);
const BaseClass = require('./BaseClass');
const moment = require('moment-timezone');

class GiftCard extends BaseClass {

  static get tableName() {
    return 'gift_card';
  }

  static get relationMappings() {
    const Client = require('./Client');
    const User = require('./User');
    const Order = require('./Order');
    const GiftCardLog = require('./GiftCardLog');

    return {
      client: {
        relation: Model.BelongsToOneRelation,
        modelClass: Client,
        join: {
          from: 'gift_card.client_id',
          to: 'client.id',
        },
      },
      sent_by_user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'gift_card.sent_by_user_id',
          to: 'user.id',
        },
      },
      paid_with_order: {
        relation: Model.BelongsToOneRelation,
        modelClass: Order,
        join: {
          from: 'gift_card.paid_with_order_id',
          to: 'order.id',
        },
      },
      log_entries: {
        relation: Model.HasManyRelation,
        modelClass: GiftCardLog,
        join: {
          from: 'gift_card.id',
          to: 'gift_card_log.gift_card_id',
        },
        filter: q => q.orderBy('createdAt', 'desc'),
      },
    };

  }

  $parseDatabaseJson(json) {

    json = super.$parseDatabaseJson(json);

    if (typeof json.valid_until !== 'undefined') {
      json.valid_until = moment(json.valid_until).format('YYYY-MM-DD');
    }

    return json;
  }

}

module.exports = GiftCard;
