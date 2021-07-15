const ClassPassObjection = require('../../objection-models/ClassPass')

module.exports = {

  friendlyName: 'Get valid class passes for class',

  description: 'Gets all valid class passes that a specific user has for livestream for a class, excluding the ones already used for the class.',

  inputs: {
    user: {
      type: 'ref',
      description: 'The user to get valid class passes for.',
      required: true,
    },

    classItem: {
      type: 'ref',
      description: 'The class to test the validity of the class passes against.',
      required: true,
    },

  },

  exits: {
    success: {},

    classNotFound: {
      description: 'Class was not found in the database.',
    },
  },

  fn: async (inputs, exits) => {

    const userId = sails.helpers.util.idOrObjectIdInteger(inputs.user)

    const classItem = await Class.findOne(
      sails.helpers.util.idOrObjectIdInteger(inputs.classItem),
    )
    if (!classItem || classItem.archived) throw 'classNotFound'

    let classPasses = await ClassPassObjection.query()
      .where({
        user: userId,
        archived: false,
      })
      .andWhere('valid_until', '>=', classItem.date)
      .eager({
        class_pass_type: {
          class_types_livestream: true,
        },
      })


    // Filter for class type
    classPasses = _.filter(
      classPasses,
      classPass => {
        return _.includes(
          _.map(classPass.class_pass_type.class_types_livestream, 'id'),
          classItem.class_type,
        )
      },
    )

    // Filter for classes_left on fixed_count class passes
    classPasses = _.filter(
      classPasses,
      classPass => classPass.class_pass_type.pass_type === 'unlimited' || classPass.classes_left > 0,
    )

    let unusedClassPasses = []
    await Promise.all(
      _.map(
        classPasses,
        async classPass => {
          const existingSignup = await ClassLivestreamSignup.find({
            user: userId,
            'class': classItem.id,
            used_class_pass: classPass.id,
            archived: false,
            cancelled_at: 0,
          })
          if (!existingSignup.length) {
            unusedClassPasses.push(classPass)
          }
        },
      ),
    )
    classPasses = unusedClassPasses;

    // Filter class passes with max number of simultaneous bookings
    /*if (_.find(classPasses, cp => cp.class_pass_type.has_max_number_of_simultaneous_bookings)) {
      const futureSignups = await sails.helpers.classes.getFutureSignups(userId);

      classPasses = _.filter(
        classPasses,
        (cp) => {
          if (!cp.class_pass_type.has_max_number_of_simultaneous_bookings) return true;
          const futureSignupsWithThisClassPass = _.filter(
            futureSignups,
            {used_class_pass_id: cp.id}
          )
          return futureSignupsWithThisClassPass.length < cp.class_pass_type.max_number_of_simultaneous_bookings
        }
      )
    }*/

    return exits.success(classPasses)
  },

}
