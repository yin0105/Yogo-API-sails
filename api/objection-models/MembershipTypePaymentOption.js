const {Model} = require('objection')
const knex = require('./knex-config')
Model.knex(knex)

class MembershipTypePaymentOption extends Model {

  static get tableName() {
    return 'membership_type_payment_option'
  }

  /*static get relationMappings() {
    const ClassType = require('./ClassType')
    const MembershipTypePaymentOption = require('./MembershipTypePaymentOption')

    return {
      class_types: {
        relation: Model.ManyToManyRelation,
        modelClass: ClassType,
        join: {
          from: 'membership_type.id',
          through: {
            from: 'classtype_membership_types__membershiptype_class_types.membershiptype_class_types',
            to: 'classtype_membership_types__membershiptype_class_types.classtype_membership_types',
          },
          to: 'class_type.id'
        }
      },
      payment_options: {
        relation: Model.HasManyRelation,
        modelClass:
      }



  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['client', 'name'],
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
        name: {
          type: 'string',
        },

      },
    }
  }*/

  $parseDatabaseJson(json) {
    // Remember to call the super class's implementation.
    json = super.$parseDatabaseJson(json)

    if (typeof json.for_sale !== 'undefined') {
      json.for_sale = !!json.for_sale
    }

    return json
  }

}

module.exports = MembershipTypePaymentOption
