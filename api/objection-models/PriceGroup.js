const {Model} = require('objection');
const knex = require('./knex-config');
Model.knex(knex);

class PriceGroup extends Model {

  static get tableName() {
    return 'price_group';
  }

  static get relationMappings() {
    const ClassPassType = require('./ClassPassType');
    const MembershipType = require('./MembershipType');

    return {
      membership_types: {
        relation: Model.ManyToManyRelation,
        modelClass: MembershipType,
        join: {
          from: 'price_group.id',
          through: {
            from: 'membershiptype_price_groups__pricegroup_membership_types.pricegroup_membership_types',
            to: 'membershiptype_price_groups__pricegroup_membership_types.membershiptype_price_groups',
          },
          to: 'membership_type.id',
        },
      },
      class_pass_types: {
        relation: Model.ManyToManyRelation,
        modelClass: ClassPassType,
        join: {
          from: 'price_group.id',
          through: {
            from: 'classpasstype_price_groups__pricegroup_class_pass_types.pricegroup_class_pass_types',
            to: 'classpasstype_price_groups__pricegroup_class_pass_types.classpasstype_price_groups',
          },
          to: 'class_pass_type.id',
        },
      },
    };
  }

  $parseDatabaseJson(json) {
    // Remember to call the super class's implementation.
    json = super.$parseDatabaseJson(json);

    // Do your conversion here.
    if (typeof json.show_in_default_price_list !== 'undefined') {
      json.show_in_default_price_list = !!json.show_in_default_price_list;
    }

    return json;
  }
}

module.exports = PriceGroup;
