const {Model} = require('objection')
const knex = require('../services/knex')
Model.knex(knex)

class NoShowFee extends Model {

  static get tableName() {
    return 'no_show_fee'
  }

  static get relationMappings() {
    const Class = require('./Class');
    const ClassSignup = require('./ClassSignup');
    const User = require('./User');
    const Order = require('./Order');
    const ClassPass = require('./ClassPass');
    const Membership = require('./Membership');

    return {
      class: {
        relation: Model.BelongsToOneRelation,
        modelClass: Class,
        join: {
          from: 'no_show_fee.class_id',
          to: 'class.id',
        },
      },
      class_signup: {
        relation: Model.BelongsToOneRelation,
        modelClass: ClassSignup,
        join: {
          from: 'no_show_fee.class_signup_id',
          to: 'class_signup.id',
        },
      },
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'no_show_fee.user_id',
          to: 'user.id',
        },
      },
      paid_with_order: {
        relation: Model.BelongsToOneRelation,
        modelClass: Order,
        join: {
          from: 'no_show_fee.paid_with_order_id',
          to: 'order.id'
        }
      },
      class_pass: {
        relation: Model.BelongsToOneRelation,
        modelClass: ClassPass,
        join: {
          from: 'no_show_fee.class_pass_id',
          to: 'class_pass.id'
        }
      },
      membership: {
        relation: Model.BelongsToOneRelation,
        modelClass: Membership,
        join: {
          from: 'no_show_fee.membership_id',
          to: 'membership.id'
        }
      }
    }

  }

}

module.exports = NoShowFee
