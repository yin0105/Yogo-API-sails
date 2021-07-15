const {Model} = require('objection');
const knex = require('./knex-config');
Model.knex(knex);

class ClassPassType extends Model {

  static get tableName() {
    return 'class_pass_type';
  }

  static get relationMappings() {
    const ClassType = require('./ClassType');
    const VideoGroup = require('./VideoGroup');

    return {
      class_types: {
        relation: Model.ManyToManyRelation,
        modelClass: ClassType,
        join: {
          from: 'class_pass_type.id',
          through: {
            from: 'classpasstype_class_types__classtype_class_pass_types.classpasstype_class_types',
            to: 'classpasstype_class_types__classtype_class_pass_types.classtype_class_pass_types',
          },
          to: 'class_type.id',
        },
      },

      class_types_livestream: {
        relation: Model.ManyToManyRelation,
        modelClass: ClassType,
        join: {
          from: 'class_pass_type.id',
          through: {
            from: 'class_pass_type_class_type_livestream.class_pass_type',
            to: 'class_pass_type_class_type_livestream.class_type',
          },
          to: 'class_type.id',
        },
      },

      video_groups: {
        relation: Model.ManyToManyRelation,
        modelClass: VideoGroup,
        join: {
          from: 'class_pass_type.id',
          through: {
            from: 'classpasstype_video_groups__videogroup_class_pass_types.classpasstype_video_groups',
            to: 'classpasstype_video_groups__videogroup_class_pass_types.videogroup_class_pass_types',
          },
          to: 'video_group.id',
        },
      },

    };

  }

}

module.exports = ClassPassType;
