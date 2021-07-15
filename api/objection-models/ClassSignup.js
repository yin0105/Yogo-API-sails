const {Model} = require('objection')
const BaseClass = require('./BaseClass')

class ClassSignup extends BaseClass {

  static get tableName() {
    return 'class_signup'
  }

  static get relationMappings() {
    const ClassPass = require('./ClassPass')
    const Membership = require('./Membership')
    const User = require('./User')
    const Class = require('./Class')
    const Client = require('./Client')
    const NoShowFee = require('./NoShowFee')

    return {
      used_class_pass: {
        relation: Model.BelongsToOneRelation,
        modelClass: ClassPass,
        join: {
          from: 'class_signup.used_class_pass',
          to: 'class_pass.id',
        },
      },
      used_membership: {
        relation: Model.BelongsToOneRelation,
        modelClass: Membership,
        join: {
          from: 'class_signup.used_membership',
          to: 'membership.id',
        },
      },
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'class_signup.user',
          to: 'user.id'
        }
      },
      'class': {
        relation: Model.BelongsToOneRelation,
        modelClass: Class,
        join: {
          from: 'class_signup.class',
          to: 'class.id'
        }
      },
      client:  {
        relation: Model.BelongsToOneRelation,
        modelClass: Client,
        join: {
          from: 'class_signup.client',
          to: 'client.id'
        }
      },
      no_show_fee: {
        relation: Model.HasOneRelation,
        modelClass: NoShowFee,
        join: {
          from: 'class_signup.id',
          to: 'no_show_fee.class_signup_id'
        }
      }
    }

  }

  $parseDatabaseJson(json) {
    // Remember to call the super class's implementation.
    json = super.$parseDatabaseJson(json);

    if (typeof json.user !== 'undefined') {
      json.user_id = json.user
      delete json.user
    }

    if (typeof json.class !== 'undefined') {
      json.class_id = json.class
      delete json.class
    }

    if (typeof json.client !== 'undefined') {
      json.client_id = json.client
      delete json.client
    }

    if (typeof json.used_membership !== 'undefined') {
      json.used_membership_id = json.used_membership
      delete json.used_membership
    }

    if (typeof json.used_class_pass !== 'undefined') {
      json.used_class_pass_id = json.used_class_pass
      delete json.used_class_pass
    }

    return json
  }

  $formatDatabaseJson(json) {
    json = super.$formatDatabaseJson(json)

    if (typeof json.user_id !== 'undefined') {
      json.user = json.user_id
      delete json.user_id
    }

    if (typeof json.class_id !== 'undefined') {
      json.class = json.class_id
      delete json.class_id
    }

    if (typeof json.client_id !== 'undefined') {
      json.client = json.client_id
      delete json.client_id
    }

    if (typeof json.used_membership_id !== 'undefined') {
      json.used_membership = json.used_membership_id
      delete json.used_membership_id
    }

    if (typeof json.used_class_pass_id !== 'undefined') {
      json.used_class_pass = json.used_class_pass_id
      delete json.used_class_pass_id
    }

    return json

  }

  static get jsonSchema() {
    return {
      type: 'object',
      properties: {
        createdAt: {
          type: 'integer',
          default: 0
        },
        updatedAt: {
          type: 'integer',
          default: 0
        },
        class_pass_seat_spent: {
          type: 'boolean',
          default: false
        },
        cancelled_at: {
          type: 'integer',
          default: 0,
        },
        checked_in: {
          type: 'integer',
          default: 0,
        },
        no_show_fee_applied: {
          type: 'boolean',
          default: false
        }
      },
    }
  }

}

module.exports = ClassSignup
