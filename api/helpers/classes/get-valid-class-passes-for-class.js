module.exports = {

  friendlyName: 'Get valid class passes for class',

  description: 'Gets all valid class passes that a specific user has for a class, including or excluding the ones already used for the class.',

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

    includeAlreadyUsedClassPasses: {
      type: 'boolean',
      description: 'Should the returned list include class passes that have already been used to sign up for the class?',
      required: true,
    },

    dbConnection: {
      type: 'ref',
      description: 'If specified, use this connection to handle the class pass record. Class pass classes_left field could be the victim of a race condition.',
      required: false,
    },
  },

  exits: {
    success: {},

    classNotFound: {
      description: 'Class was not found in the database.',
    },
  },

  fn: async (inputs, exits) => {

    const userId = sails.helpers.util.idOrObjectIdInteger(inputs.user);

    const classItem = await Class.findOne(
      sails.helpers.util.idOrObjectIdInteger(inputs.classItem),
    );
    if (!classItem || classItem.archived) throw 'classNotFound';


    let classPasses = await ClassPass.find({
      where: {
        user: userId,
        valid_until: {
          '>=': classItem.toJSON().date,
        },
        archived: false,
      },
    }).populate('class_pass_type');

    const classPassTypeIds = _.map(
      classPasses,
      classPass => classPass.class_pass_type.id,
    );
    let classPassTypes = await ClassPassType.find({
      id: classPassTypeIds,
    }).populate('class_types');
    classPassTypes = _.keyBy(classPassTypes, 'id');

    _.each(
      classPasses,
      classPass => {
        classPass.class_pass_type = classPassTypes[classPass.class_pass_type.id];
      },
    );

    // Filter for class type
    classPasses = _.filter(
      classPasses,
      classPass => {
        const classTypeIds = _.map(classPass.class_pass_type.class_types, 'id');
        return _.includes(classTypeIds, classItem.class_type);
      },
    );

    // Filter for classes_left on fixed_count class passes
    classPasses = _.filter(
      classPasses,
      classPass => {
        return classPass.class_pass_type.pass_type === 'unlimited' || classPass.classes_left > 0;
      },
    );

    // Filter for unused class passes
    if (!inputs.includeAlreadyUsedClassPasses) {
      let unusedClassPasses = [];
      await Promise.all(
        _.map(
          classPasses,
          async classPass => {
            const existingSignup = await ClassSignup.find({
              user: userId,
              'class': classItem.id,
              used_class_pass: classPass.id,
              archived: false,
              cancelled_at: 0,
            });
            if (!existingSignup.length) {
              unusedClassPasses.push(classPass);
            }
          },
        ),
      );
      classPasses = unusedClassPasses;
    }

    // Filter class passes with max number of simultaneous bookings
    if (_.find(classPasses, cp => cp.class_pass_type.has_max_number_of_simultaneous_bookings)) {
        const futureSignups = await sails.helpers.classes.getFutureClassAndWaitingListSignups(userId);

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
    }

    return exits.success(classPasses);
  },

};
