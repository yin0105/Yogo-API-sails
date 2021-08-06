module.exports = {

  friendlyName: 'Create signup',

  description: 'Creates class signup if the customer has a valid membership or class pass',

  inputs: {
    user: {
      type: 'ref',
      description: 'The user that should be signed up for the class. Can be a user object or a user id.',
      required: true,
    },

    classItem: {
      type: 'ref',
      description: 'The class that the user should be signed up for. Can be a class object or a class id.',
      required: true,
    },

    checkCustomerIn: {
      type: 'boolean',
      description: 'Should the user be checked in for the class right away? Defaults to "no".',
      required: false,
    },

    allowOverbooking: {
      type: 'boolean',
      description: 'Allow booking even if the class is already full.',
      defaultsTo: false,
    },

    classpass_com_reservation_id: {
      type: 'string',
      description: 'Reservation ID from ClassPass.com'
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

    userAndClassAreOnDifferentClients: {
      description: 'User and class are on different clients',
    },

    alreadySignedUp: {
      description: 'Customer is already signed up for the class.',
    },

    classCancelled: {
      description: 'Class is cancelled.',
    },

    classIsFull: {
      description: 'There are no available seats on the class.',
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

    if (parseInt(user.client, 10) !== parseInt(classItem.client, 10)) {
      throw 'userAndClassAreOnDifferentClients';
    }

    // IS CUSTOMER ALREADY SIGNED UP?
    const existingSignups = await ClassSignup.find({
      user: user.id,
      'class': classItem.id,
      archived: false,
      cancelled_at: 0,
    });

    if (_.isArray(existingSignups) && existingSignups.length > 0) {
      throw 'alreadySignedUp';
    }

    // IS THE CLASS CANCELLED?
    if (classItem.cancelled) {
      throw 'classCancelled';
    }


    if (!inputs.allowOverbooking) {
      // ARE THERE ANY AVAILABLE SEATS IN THE CLASS?
      let signupsForClass = await ClassSignup.find({
        'class': classItem.id,
        archived: false,
        cancelled_at: 0,
      });

      if (signupsForClass.length >= classItem.seats) {
        throw 'classIsFull';
      }
    }

    let signupData = {
      client: user.client,
      user: user.id,
      class: classItem.id,
      checked_in: inputs.checkCustomerIn ? Date.now() : 0,
    };

    // IS THERE A VALID, UNUSED MEMBERSHIP FOR THIS CLASS?
    const memberships = await sails.helpers.classes.getValidMembershipsForClass.with({
      user: user,
      classItem: classItem,
    });

    // IS THERE A VALID CLASS PASS FOR THIS CLASS?
    let classPasses = await sails.helpers.classes.getValidClassPassesForClass.with({
      user: user,
      classItem: classItem,
      includeAlreadyUsedClassPasses: false,
    });

    // USE UNLIMITED CLASS PASSES FIRST AND USE THE FIXED CLASS PASS THAT EXPIRES FIRST
    classPasses = _.sortBy(
      classPasses,
      classPass => classPass.class_pass_type.pass_type === 'unlimited' ? 0 : 1,
    );

    if (classPasses.length && classPasses[0].class_pass_type.pass_type === 'fixed_count') {
      classPasses = _.sortBy(classPasses, 'valid_until')
    }

    let usingFixedClassPass = false;
    if (memberships && memberships.length > 0) {
      signupData.used_membership = memberships[0].id;
      signupData.used_class_pass = null;
      signupData.class_pass_seat_spent = false;
      signupData.classpass_com_reservation_id = null;
    } else if (classPasses && classPasses.length > 0) {
      let classPass = classPasses[0];
      signupData.used_class_pass = classPass.id;
      signupData.class_pass_seat_spent = classPass.class_pass_type.pass_type === 'fixed_count';
      signupData.used_membership = null;
      signupData.classpass_com_reservation_id = null;
      usingFixedClassPass = classPass.class_pass_type.pass_type === 'fixed_count';
    } else if (inputs.classpass_com_reservation_id) {
      signupData.used_membership = null
      signupData.used_class_pass = null;
      signupData.class_pass_seat_spent = false;
      signupData.classpass_com_reservation_id = inputs.classpass_com_reservation_id;
    } else {
      throw 'noAccess';
    }


    signupData.createdAt = Date.now();
    signupData.updatedAt = Date.now();

    let insertSignupResult;

    if (usingFixedClassPass) {

      [insertSignupResult] = await knex.raw(`
                  INSERT INTO class_signup(createdAt, updatedAt, client, user, class, checked_in, archived, cancelled_at, used_class_pass,
                                                        used_membership, class_pass_seat_spent, no_show_fee_applied, classpass_com_reservation_id)
                  SELECT :createdAt,
                         :updatedAt,
                         :client,
                         :user,
                         :class,
                         :checked_in,
                         0,
                         0,
                         :used_class_pass,
                         :used_membership,
                         :class_pass_seat_spent,
                         0,
                         :classpass_com_reservation_id
                  FROM dual
                  WHERE (
                      SELECT id FROM class_signup WHERE user = :user AND class = :class AND archived = 0 AND cancelled_at = 0 LIMIT 1
                  ) IS NULL
                    AND (
                            SELECT classes_left
                            FROM class_pass
                            WHERE id = :used_class_pass
                        ) > 0
        `,
        signupData,
      );

      if (insertSignupResult.affectedRows) {
        const [updateClassPassResult] = await knex.raw(
          'UPDATE class_pass SET classes_left = classes_left - 1 WHERE id = ? AND classes_left > 0',
          [signupData.used_class_pass],
        );
        if (!updateClassPassResult.affectedRows) {
          await ClassSignup.destroy({id: insertSignupResult.insertId});
          throw 'noAccess';
        }
      }

    } else {

      [insertSignupResult] = await knex.raw(`
                  INSERT INTO class_signup(createdAt, updatedAt, client, user, class, checked_in, archived, cancelled_at, used_class_pass,
                                                        used_membership, class_pass_seat_spent, no_show_fee_applied, classpass_com_reservation_id)
                  SELECT :createdAt,
                         :updatedAt,
                         :client,
                         :user,
                         :class,
                         :checked_in,
                         0,
                         0,
                         :used_class_pass,
                         :used_membership,
                         :class_pass_seat_spent,
                         0,
                         :classpass_com_reservation_id  
                  FROM dual
                  WHERE (
                            SELECT id
                            FROM class_signup
                            WHERE user = :user
                              AND class = :class
                              AND archived = 0
                              AND cancelled_at = 0
                            LIMIT 1
                        ) IS NULL`,
        signupData,
      );

    }

    if (insertSignupResult.affectedRows) {

      const insertedSignup = await ClassSignup.findOne(insertSignupResult.insertId);

      await sails.helpers.classTypeEmails.checkAndSendForClassSignup(insertedSignup);

      return exits.success(insertedSignup);

    } else {
      // This must be due to another simultaneous signup,
      // since it was not catched in top of file with 'alreadySignedUp'
      const [existingSignup] = await ClassSignup.find({
        user: signupData.user,
        'class': signupData.class,
        archived: 0,
        cancelled_at: 0,
      });
      return exits.success(existingSignup);
    }

  },

};
