const {Model} = require('objection');
const knex = require('./knex-config');
Model.knex(knex);

const moment = require('moment');

class Membership extends Model {

  static get tableName() {
    return 'membership';
  }

  static get relationMappings() {
    const MembershipLog = require('./MembershipLog');
    const MembershipType = require('./MembershipType');
    const MembershipPause = require('./MembershipPause');
    const User = require('./User');
    const PaymentSubscription = require('./PaymentSubscription');
    const MembershipTypePaymentOption = require('./MembershipTypePaymentOption');
    const DiscountCode = require('./DiscountCode');
    const MembershipCampaign = require('./MembershipCampaign');
    const NoShowFee = require('./NoShowFee');
    const Order = require('./Order');

    return {
      log_entries: {
        relation: Model.HasManyRelation,
        modelClass: MembershipLog,
        join: {
          from: 'membership.id',
          to: 'membership_log.membership',
        },
      },
      membership_type: {
        relation: Model.BelongsToOneRelation,
        modelClass: MembershipType,
        join: {
          from: 'membership.membership_type',
          to: 'membership_type.id',
        },
      },
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'membership.user',
          to: 'user.id',
        },
      },
      payment_subscriptions: {
        relation: Model.HasManyRelation,
        modelClass: PaymentSubscription,
        join: {
          from: 'membership.id',
          to: 'payment_subscription.membership',
        },
      },
      payment_option: {
        relation: Model.BelongsToOneRelation,
        modelClass: MembershipTypePaymentOption,
        join: {
          from: 'membership.payment_option',
          to: 'membership_type_payment_option.id',
        },
      },
      discount_code: {
        relation: Model.BelongsToOneRelation,
        modelClass: DiscountCode,
        join: {
          from: 'membership.discount_code',
          to: 'discount_code.id',
        },
      },
      membership_campaign: {
        relation: Model.BelongsToOneRelation,
        modelClass: MembershipCampaign,
        join: {
          from: 'membership.membership_campaign',
          to: 'membership_campaign.id',
        },
      },
      pending_no_show_fees: {
        relation: Model.HasManyRelation,
        modelClass: NoShowFee,
        join: {
          from: 'membership.id',
          to: 'no_show_fee.membership_id',
        },
        filter: q => q.where({
          archived: 0,
          cancelled_at: 0,
          paid_with_order_id: null,
        }),
      },
      orders: {
        relation: Model.HasManyRelation,
        modelClass: Order,
        join: {
          from: 'membership.id',
          to: 'order.membership',
        },
      },
      membership_pauses: {
        relation: Model.HasManyRelation,
        modelClass: MembershipPause,
        join: {
          from: 'membership.id',
          to: 'membership_pause.membership_id',
        },
        filter: q => q.where({
          archived: 0,
        }),
      },
    };

  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['client', 'start_date', 'paid_until'],
      properties: {
        createdAt: {
          type: 'integer',
          default: 0,
        },
        updatedAt: {
          type: 'integer',
          default: 0,
        },
        client: {
          type: 'integer',
        },
        user: {
          type: 'integer',
        },

        membership_type: {
          type: 'integer',
        },

        payment_option: {
          type: 'integer',
        },

        start_date: {
          type: 'date',
        },

        paid_until: {
          type: 'date',
        },
      },
    };
  }

  $parseDatabaseJson(json) {
    // Remember to call the super class's implementation.
    json = super.$parseDatabaseJson(json);

    // Do your conversion here.
    if (typeof json.real_user_image !== 'undefined') {
      json.real_user_image_id = json.real_user_image;
      delete json.real_user_image;
    }

    if (typeof json.membership_type !== 'undefined') {
      json.membership_type_id = json.membership_type;
      delete json.membership_type;
    }

    if (typeof json.user !== 'undefined') {
      json.user_id = json.user;
      delete json.user;
    }

    if (typeof json.payment_option !== 'undefined') {
      json.payment_option_id = json.payment_option;
      delete json.payment_option;
    }

    if (typeof json.discount_code !== 'undefined') {
      json.discount_code_id = json.discount_code;
      delete json.discount_code;
    }

    if (typeof json.membership_campaign !== 'undefined') {
      json.membership_campaign_id = json.membership_campaign;
      delete json.membership_campaign;
    }

    if (typeof json.start_date !== 'undefined') {
      json.start_date = moment(json.start_date).format('YYYY-MM-DD');
    }

    if (typeof json.paid_until !== 'undefined') {
      json.paid_until = moment(json.paid_until).format('YYYY-MM-DD');
    }

    if (json.cancelled_from_date) {
      json.cancelled_from_date = moment(json.cancelled_from_date).format('YYYY-MM-DD');
    }

    return json;
  }

  $formatDatabaseJson(json) {
    json = super.$formatDatabaseJson(json);

    if (typeof json.membership_type_id !== 'undefined') {
      json.membership_type = json.membership_type_id;
      delete json.membership_type_id;
    }

    if (typeof json.user_id !== 'undefined') {
      json.user = json.user_id;
      delete json.user_id;
    }

    if (typeof json.payment_option_id !== 'undefined') {
      json.payment_option = json.payment_option_id;
      delete json.payment_option_id;
    }

    if (typeof json.discount_code_id !== 'undefined') {
      json.discount_code = json.discount_code_id;
      delete json.discount_code_id;
    }

    if (typeof json.membership_campaign_id !== 'undefined') {
      json.membership_campaign = json.membership_campaign_id;
      delete json.membership_campaign_id;
    }

    return json;

  }

}

module.exports = Membership;
