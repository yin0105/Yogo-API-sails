const {Model} = require('objection');
const knex = require('../services/knex');
Model.knex(knex);

class ClassType extends Model {

  static get tableName() {
    return 'class_type';
  }

  static get relationMappings() {
    const Image = require('./Image');
    const ClassPassType = require('./ClassPassType');
    const MembershipType = require('./MembershipType');
    const ClassTypeEmail = require('./ClassTypeEmail');

    return {
      image: {
        relation: Model.HasOneRelation,
        modelClass: Image,
        join: {
          from: 'class_type.image',
          to: 'image.id',
        },
      },
      class_pass_types: {
        relation: Model.ManyToManyRelation,
        modelClass: ClassPassType,
        join: {
          from: 'class_type.id',
          through: {
            from: 'classpasstype_class_types__classtype_class_pass_types.classtype_class_pass_types',
            to: 'classpasstype_class_types__classtype_class_pass_types.classpasstype_class_types',
          },
          to: 'class_pass_type.id',
        },
      },
      class_pass_types_livestream: {
        relation: Model.ManyToManyRelation,
        modelClass: ClassPassType,
        join: {
          from: 'class_type.id',
          through: {
            from: 'class_pass_type_class_type_livestream.class_type',
            to: 'class_pass_type_class_type_livestream.class_pass_type',
          },
          to: 'class_pass_type.id',
        },
      },
      membership_types: {
        relation: Model.ManyToManyRelation,
        modelClass: MembershipType,
        join: {
          from: 'class_type.id',
          through: {
            from: 'classtype_membership_types__membershiptype_class_types.classtype_membership_types',
            to: 'classtype_membership_types__membershiptype_class_types.membershiptype_class_types',
          },
          to: 'membership_type.id',
        },
      },
      membership_types_livestream: {
        relation: Model.ManyToManyRelation,
        modelClass: MembershipType,
        join: {
          from: 'class_type.id',
          through: {
            from: 'membership_type_class_type_livestream.class_type',
            to: 'membership_type_class_type_livestream.membership_type',
          },
          to: 'membership_type.id',
        },
      },
      class_type_emails: {
        relation: Model.ManyToManyRelation,
        modelClass: ClassTypeEmail,
        join: {
          from: 'class_type.id',
          through: {
            from: 'class_type_email_class_type.class_type_id',
            to: 'class_type_email_class_type.class_type_email_id',
          },
          to: 'class_type_email.id',
        },
      },
    };
  }

  $parseDatabaseJson(json) {
    // Remember to call the super class's implementation.
    json = super.$parseDatabaseJson(json);

    // Do your conversion here.
    if (typeof json.image !== 'undefined') {
      json.image_id = json.image;
      delete json.image;
    }

    return json;
  }

}

module.exports = ClassType;
