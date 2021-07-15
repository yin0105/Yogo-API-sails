/**
 * JoinClassTypeLivestreamMembershipType.js
 *
 * @description :: This is a join table for the many-to-many relation between ClassType and MembershipType, specifically for livestream.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  tableName: 'membership_type_class_type_livestream',

  attributes: {

    class_type: {
      model: 'ClassType',
    },

    membership_type: {
      model: 'MembershipType',
    },

  },

}

