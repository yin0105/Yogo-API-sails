const {Model} = require('objection')
const BaseClass = require('./BaseClass')

class ClassWaitingListSignup extends BaseClass {

  static get tableName() {
    return 'class_waiting_list_signup'
  }

  static get relationMappings() {
    const ClassPass = require('./ClassPass')
    const Membership = require('./Membership')
    const User = require('./User')
    const Class = require('./Class')
    const Client = require('./Client')

    return {
      used_class_pass: {
        relation: Model.BelongsToOneRelation,
        modelClass: ClassPass,
        join: {
          from: 'class_waiting_list_signup.used_class_pass',
          to: 'class_pass.id',
        },
      },
      used_membership: {
        relation: Model.BelongsToOneRelation,
        modelClass: Membership,
        join: {
          from: 'class_waiting_list_signup.used_membership',
          to: 'membership.id',
        },
      },
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'class_waiting_list_signup.user',
          to: 'user.id',
        },
      },
      'class': {
        relation: Model.BelongsToOneRelation,
        modelClass: Class,
        join: {
          from: 'class_waiting_list_signup.class',
          to: 'class.id',
        },
      },
      client: {
        relation: Model.BelongsToOneRelation,
        modelClass: Client,
        join: {
          from: 'class_waiting_list_signup.client',
          to: 'client.id',
        },
      },
    }

  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['client', 'class'],
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

        class: {
          type: 'integer',
        },

      },
    }
  }

  $parseDatabaseJson(json) {
    // Remember to call the super class's implementation.
    json = super.$parseDatabaseJson(json)

    if (typeof json.client !== 'undefined') {
      json.client_id = json.client
      delete json.client
    }

    if (typeof json.user !== 'undefined') {
      json.user_id = json.user
      delete json.user
    }

    if (typeof json.used_membership !== 'undefined') {
      json.used_membership_id = json.used_membership
      delete json.used_membership
    }

    if (typeof json.class !== 'undefined') {
      json.class_id = json.class
      delete json.class
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

}

module.exports = ClassWaitingListSignup
