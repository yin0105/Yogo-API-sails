module.exports = {
  friendlyName: 'Populate class_is_on_users_birthday',

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

    if (typeof inputs.classSignups[0].class_is_on_users_birthday !== 'undefined') {
      return exits.success();
    }

    await sails.helpers.populate.classSignups.classObj(inputs.classSignups);
    await sails.helpers.populate.classSignups.user(inputs.classSignups);

    for (let i = 0; i < inputs.classSignups.length; i++) {

      const classSignup = inputs.classSignups[i];

      if (
        !classSignup.user.date_of_birth
        || classSignup.user.date_of_birth === '0000-00-00'
        || classSignup.user.date_of_birth === 'Invalid date'
      ) {
        classSignup.class_is_on_users_birthday = false;
        continue;
      }

      const birthDate = sails.helpers.util.normalizeDate(classSignup.user.date_of_birth);

      if (birthDate.year() < 1900) {
        classSignup.class_is_on_users_birthday = false;
        continue;
      }

      const classDate = sails.helpers.util.normalizeDate(classSignup.class.date);

      classSignup.class_is_on_users_birthday = birthDate.date() === classDate.date() && birthDate.month() === classDate.month();

    }

    return exits.success();

  },
};
