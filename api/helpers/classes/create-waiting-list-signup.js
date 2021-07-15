module.exports = {

  friendlyName: 'Create signup',

  description: 'Creates class waiting list signup if the customer has a valid membership or class pass',

  inputs: {
    user: {
      type: 'ref',
      description: 'The user that should be signed up for the waiting list. Can be a user object or a user id.',
      required: true,
    },

    classItem: {
      type: 'ref',
      description: 'The class that the user should be signed up for waiting list for. Can be a class object or a class id.',
      required: true,
    },
  },

  exits: {
    success: {
      responseType: 'ref',
    },

    userNotFound: {
      description: 'User was not found in the database.',
    },

    classNotFound: {
      description: 'Class was not found in the database.',
    },

    alreadySignedUp: {
      description: 'Customer is already signed up for the class.',
    },

    alreadySignedUpForWaitingList: {
      description: 'Customer is already signed up for the waiting list',
    },

    classCancelled: {
      description: 'Class is cancelled.',
    },

    classIsNotFull: {
      description: 'There are still available seats on the class.',
    },

    waitingListIsFull: {
      description: 'There are no seats left on the waiting list.',
    },

    noAccess: {
      description: 'Customer does not have a valid membership or class pass for the class.',
    },

  },

  fn: async (inputs, exits) => {

    const user = await User.findOne(
      sails.helpers.util.idOrObjectIdInteger(inputs.user),
    );
    if (!user || user.archived) {
      throw 'userNotFound';
    }

    const classItem = await Class.findOne(
      sails.helpers.util.idOrObjectIdInteger(inputs.classItem),
    );
    if (!classItem || classItem.archived) {
      throw 'classNotFound';
    }

    await sails.helpers.populate.classes.userIsSignedUpForClass([classItem], user);
    if (classItem.user_is_signed_up_for_class) {
      throw 'alreadySignedUp';
    }

    await sails.helpers.populate.classes.userIsSignedUpForWaitingList([classItem], user);
    if (classItem.user_is_signed_up_for_waiting_list) {
      throw 'alreadySignedUpForWaitingList';
    }

    if (classItem.cancelled) {
      throw 'classCancelled';
    }

    await sails.helpers.populate.classes.classIsFullyBooked([classItem]);
    if (!classItem.class_is_fully_booked) {
      throw 'classIsNotFull';
    }

    await sails.helpers.populate.classes.waitingListIsFull([classItem]);
    if (classItem.waiting_list_is_full) {
      throw 'waitingListIsFull';
    }


    let waitingListSignupData = {
      client: user.client,
      user: user.id,
      class: classItem.id,
    };


    // IS THERE A VALID, UNUSED MEMBERSHIP FOR THIS CLASS?
    const memberships = await sails.helpers.classes.getValidMembershipsForClass.with({
      user: user,
      classItem: classItem,
    });

    // IS THERE A VALID, UNUSED CLASS PASS FOR THIS CLASS?
    let classPasses = await sails.helpers.classes.getValidClassPassesForClass.with({
      user: user,
      classItem: classItem,
      includeAlreadyUsedClassPasses: false,
    });

    // USE UNLIMITED CLASS PASSES FIRST AND USE FIXED COUNT PASS THAT EXPIRES FIRST
    classPasses = _.sortBy(
      classPasses,
      classPass => (classPass.class_pass_type.pass_type === 'unlimited' ? 0 : 1),
    );

    if (classPasses.length && classPasses[0].class_pass_type.pass_type === 'fixed_count') {
      classPasses = _.sortBy(classPasses, 'valid_until');
    }

    let usingFixedClassPass = false;
    if (memberships && memberships.length > 0) {
      waitingListSignupData.used_membership = memberships[0].id;
      waitingListSignupData.used_class_pass = null;
      waitingListSignupData.class_pass_seat_spent = false;
    } else if (classPasses && classPasses.length > 0) {
      let classPass = classPasses[0];
      waitingListSignupData.used_class_pass = classPass.id;
      waitingListSignupData.class_pass_seat_spent = classPass.class_pass_type.pass_type === 'fixed_count';
      waitingListSignupData.used_membership = null;
      usingFixedClassPass = classPass.class_pass_type.pass_type === 'fixed_count';
    } else {
      throw 'noAccess';
    }


    waitingListSignupData.createdAt = Date.now();
    waitingListSignupData.updatedAt = Date.now();

    let insertWaitingListSignupResult;

    if (usingFixedClassPass) {

      [insertWaitingListSignupResult] = await knex.raw(`
                  INSERT INTO class_waiting_list_signup(createdAt, updatedAt, client, user, class, archived, cancelled_at, used_class_pass,
                                                        used_membership, class_pass_seat_spent)
                  SELECT :createdAt,
                         :updatedAt,
                         :client,
                         :user,
                         :class,
                         0,
                         0,
                         :used_class_pass,
                         :used_membership,
                         :class_pass_seat_spent
                  FROM dual
                  WHERE (
                      SELECT id FROM class_waiting_list_signup WHERE user = :user AND class = :class AND archived = 0 AND cancelled_at = 0 LIMIT 1
                  ) IS NULL
                    AND (
                            SELECT classes_left
                            FROM class_pass
                            WHERE id = :used_class_pass
                        ) > 0
        `,
        waitingListSignupData,
      );

      if (insertWaitingListSignupResult.affectedRows) {
        const [updateClassPassResult] = await knex.raw(
          'UPDATE class_pass SET classes_left = classes_left - 1 WHERE id = ? AND classes_left > 0',
          [waitingListSignupData.used_class_pass],
        );
        if (!updateClassPassResult.affectedRows) {
          await ClassWaitingListSignup.destroy({id: insertWaitingListSignupResult.insertId});
          throw 'noAccess';
        }
      }

    } else {

      [insertWaitingListSignupResult] = await knex.raw(`
                  INSERT INTO class_waiting_list_signup(createdAt, updatedAt, client, user, class, archived, cancelled_at, used_class_pass,
                                                        used_membership, class_pass_seat_spent)
                  SELECT :createdAt,
                         :updatedAt,
                         :client,
                         :user,
                         :class,
                         0,
                         0,
                         :used_class_pass,
                         :used_membership,
                         :class_pass_seat_spent
                  FROM dual
                  WHERE (
                            SELECT id
                            FROM class_waiting_list_signup
                            WHERE user = :user
                              AND class = :class
                              AND archived = 0
                              AND cancelled_at = 0
                            LIMIT 1
                        ) IS NULL`,
        waitingListSignupData,
      );

    }

    if (insertWaitingListSignupResult.affectedRows) {

      const insertedWaitingListSignup = await ClassWaitingListSignup.findOne(insertWaitingListSignupResult.insertId);

      await sails.helpers.classTypeEmails.checkAndSendForWaitingListSignup(insertedWaitingListSignup);

      return exits.success(insertedWaitingListSignup);

    } else {
      // This must be due to another simultaneous signup,
      // since it was not catched in top of file with 'alreadySignedUpForWaitingList'
      const [existingWaitingListSignup] = await ClassWaitingListSignup.find({
        user: waitingListSignupData.user,
        'class': waitingListSignupData.class,
        archived: 0,
        cancelled_at: 0,
      });
      return exits.success(existingWaitingListSignup);
    }


  },

};
