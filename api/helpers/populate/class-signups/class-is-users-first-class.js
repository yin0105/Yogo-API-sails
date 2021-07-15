module.exports = {
  friendlyName: 'Populate class_is_users_first_class',

  inputs: {
    classSignups: {
      type: 'ref',
      required: true,
    },
  },

  fn: async (inputs, exits) => {

    if (!inputs.classSignups.length) {
      return exits.success([]);
    }

    if (typeof inputs.classSignups[0].class_is_users_first_class !== 'undefined') {
      return exits.success();
    }

    const userIds = _.map(inputs.classSignups, cs => cs.user_id || sails.helpers.util.idOrObjectIdInteger(cs.user));

    const allUserClassSignups = await knex({cs: 'class_signup'})
      .innerJoin({c: 'class'}, 'cs.class', 'c.id')
      .where('cs.user', 'in', userIds)
      .where({
        'cs.archived': 0,
        'cs.cancelled_at': 0,
        'c.archived': 0,
        'c.cancelled': 0,
      })
      .select([
        'cs.user',
        'cs.class',
        'c.date',
        'c.start_time'
      ]);

    const allUserLivestreamSignups = await knex({cls: 'class_livestream_signup'})
      .innerJoin({c: 'class'}, 'cls.class', 'c.id')
      .where('cls.user', 'in', userIds)
      .where({
        'cls.archived': 0,
        'cls.cancelled_at': 0,
        'c.archived': 0,
        'c.cancelled': 0,
      })
      .select([
        'cls.user',
        'cls.class',
        'c.date',
        'c.start_time'
      ]);


    const firstSignupsByUserId = _.chain(allUserClassSignups)
      .concat(allUserLivestreamSignups)
      .orderBy(['date','start_time'])
      .groupBy('user')
      .mapValues(userSignups => userSignups[0])
      .value();

    for (let i = 0; i < inputs.classSignups.length; i++) {

      const classSignup = inputs.classSignups[i];
      const classSignupUserId = classSignup.user_id || sails.helpers.util.idOrObjectIdInteger(classSignup.user);
      const classSignupClassId = classSignup.class_id || sails.helpers.util.idOrObjectIdInteger(classSignup.class);

      const firstSignupForUser = firstSignupsByUserId[classSignupUserId];

      if (firstSignupForUser) {
        classSignup.class_is_users_first_class = parseInt(classSignupClassId) === parseInt(firstSignupForUser.class);
      } else {
        // There might not be a "first signup". If the signup being tested is a waitlist signup, and the user has no other signups.
        classSignup.class_is_users_first_class = true;
      }

    }

    return exits.success();

  },
};
