/**
 * JoinClassTypeLivestreamMembershipType.js
 *
 * @description :: This is a join table for the many-to-many relation between ClassType and ClassPassType, specifically for livestream.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  tableName: 'class_pass_type_class_type_livestream',

  attributes: {

    class_type: {
      model: 'ClassType',
    },

    class_pass_type: {
      model: 'ClassPassType',
    },

  },

}

