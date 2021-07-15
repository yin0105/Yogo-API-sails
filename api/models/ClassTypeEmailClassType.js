/**
 * ClassTypeEmailClassType.js
 *
 * @description :: This is a join table for class types and class type emails.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  tableName: 'class_type_email_class_type',

  attributes: {

    class_type_id: {
      model: 'ClassType',
    },

    class_type_email_id: {
      model: 'ClassTypeEmail',
    },

  },

}

