module.exports = {

  friendlyName: 'Create livestream signup',

  description: 'Creates livestream signup if the customer has a valid membership or class pass',

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

    const existingSignups = await ClassLivestreamSignup.find({
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

    // ARE THERE ANY AVAILABLE SEATS IN THE CLASS?
    let signUpsForClass = await ClassLivestreamSignup.find({
      'class': classItem.id,
      archived: false,
      cancelled_at: 0,
    });

    if (signUpsForClass.length >= sails.config.fmLiveswitch.maxConnectionsPerSession - 1) {
      throw 'classIsFull';
    }


    let signupData = {
      client: user.client,
      user: user.id,
      class: classItem.id,
    };


    // IS THERE A VALID, UNUSED MEMBERSHIP FOR THIS CLASS?
    const memberships = await sails.helpers.classes.getValidMembershipsForLivestream.with({
      user: user,
      classItem: classItem,
    });

    // IS THERE A VALID CLASS PASS FOR THIS CLASS?
    let classPasses = await sails.helpers.classes.getValidClassPassesForLivestream.with({
      user: user,
      classItem: classItem,
    });

    // USE UNLIMITED CLASS PASSES FIRST AND USE THE FIXED CLASS PASS THAT EXPIRES FIRST
    classPasses = _.sortBy(
      classPasses,
      classPass => classPass.class_pass_type.pass_type === 'unlimited' ? 0 : 1,
    );

    if (classPasses.length && classPasses[0].class_pass_type.pass_type === 'fixed_count') {
      classPasses = _.sortBy(classPasses, 'valid_until');
    }

    console.log("membership = ", memberships)
    let usingFixedClassPass = false;
    if (memberships && memberships.length > 0) {
      signupData.used_membership = memberships[0].id;
      console.log("1: used_membership = ", signupData.used_membership)
      signupData.used_class_pass = null;
      signupData.class_pass_seat_spent = false;
    } else if (classPasses && classPasses.length > 0) {
      let classPass = classPasses[0];
      signupData.used_class_pass = classPass.id;
      signupData.used_membership = null;
      signupData.class_pass_seat_spent = classPass.class_pass_type.pass_type === 'fixed_count';
      usingFixedClassPass = classPass.class_pass_type.pass_type === 'fixed_count';
    } else {
      throw 'noAccess';
    }


    signupData.createdAt = Date.now();
    signupData.updatedAt = Date.now();

    console.log("classes/create-live: 147: signupData = ", signupData)

    let insertLivestreamSignupResult;

    if (usingFixedClassPass) {

      [insertLivestreamSignupResult] = await knex.raw(`
                  INSERT INTO class_livestream_signup(createdAt, updatedAt, client, user, class, archived, cancelled_at, used_class_pass,
                                                        used_membership, class_pass_seat_spent, notification_email_sent)
                  SELECT :createdAt,
                         :updatedAt,
                         :client,
                         :user,
                         :class,                        
                         0,
                         0,
                         :used_class_pass,
                         :used_membership,
                         :class_pass_seat_spent,
                         0
                  FROM dual
                  WHERE (
                      SELECT id FROM class_livestream_signup WHERE user = :user AND class = :class AND archived = 0 AND cancelled_at = 0 LIMIT 1
                  ) IS NULL
                    AND (
                            SELECT classes_left
                            FROM class_pass
                            WHERE id = :used_class_pass
                        ) > 0
        `,
        signupData,
      );

      if (insertLivestreamSignupResult.affectedRows) {
        const [updateClassPassResult] = await knex.raw(
          'UPDATE class_pass SET classes_left = classes_left - 1 WHERE id = ? AND classes_left > 0',
          [signupData.used_class_pass],
        );
        if (!updateClassPassResult.affectedRows) {
          await ClassLivestreamSignup.destroy({id: insertLivestreamSignupResult.insertId});
          throw 'noAccess';
        }
      }

    } else {

      [insertLivestreamSignupResult] = await knex.raw(`
                  INSERT INTO class_livestream_signup(createdAt, updatedAt, client, user, class, archived, cancelled_at, used_class_pass,
                                                        used_membership, class_pass_seat_spent, notification_email_sent)
                  SELECT :createdAt,
                         :updatedAt,
                         :client,
                         :user,
                         :class,                         
                         0,
                         0,
                         :used_class_pass,
                         :used_membership,
                         :class_pass_seat_spent,
                         0
                  FROM dual
                  WHERE (
                            SELECT id
                            FROM class_livestream_signup
                            WHERE user = :user
                              AND class = :class
                              AND archived = 0
                              AND cancelled_at = 0
                            LIMIT 1
                        ) IS NULL`,
        signupData,
      );

    }

    if (insertLivestreamSignupResult.affectedRows) {

      const insertedLivestreamSignup = await ClassLivestreamSignup.findOne(insertLivestreamSignupResult.insertId);

      await sails.helpers.classTypeEmails.checkAndSendForLivestreamSignup(insertedLivestreamSignup);

      return exits.success(insertedLivestreamSignup);

    } else {
      // This must be due to another simultaneous signup,
      // since it was not catched in top of file with 'alreadySignedUp'
      const [existingSignup] = await ClassLivestreamSignup.find({
        user: signupData.user,
        'class': signupData.class,
        archived: 0,
        cancelled_at: 0,
      });
      return exits.success(existingSignup);
    }

  },

};
