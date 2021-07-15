const knex = require('../../../objection-models/knex-config');

module.exports = {
  friendlyName: 'User number on waiting list',

  inputs: {
    classes: {
      type: 'ref',
      description: 'The classes to populate with',
      required: true,
    },
    user: {
      type: 'json',
      description: 'The current user',
      required: false,
    },
  },

  fn: async function (inputs, exits) {

    if (!inputs.classes.length) {
      return exits.success([]);
    }

    if (typeof inputs.classes[0].user_number_on_waiting_list !== 'undefined') {
      return exits.success(inputs.classes);
    }

    if (!inputs.user) {
      _.each(inputs.classes, cls => {
        cls.user_number_on_waiting_list = null;
      });
      return exits.success(inputs.classes);
    }

    await sails.helpers.populate.classes.userWaitingListSignupId(inputs.classes, inputs.user);

    await Promise.all(_.map(inputs.classes, async cls => {

      if (!cls.user_waiting_list_signup_id) {
        cls.user_number_on_waiting_list = null;
        return;
      }

      const signupCreatedAt = (await knex({cwls: 'class_waiting_list_signup'})
          .where({
            id: cls.user_waiting_list_signup_id,
          })
          .first()
      ).createdAt;

      let numberOfPeopleInFrontOfUser = (
        await knex({cwls: 'class_waiting_list_signup'})
          .where({
            class: cls.id,
            archived: false,
            cancelled_at: 0,
          })
          .andWhere(
            'createdAt',
            '<',
            signupCreatedAt,
          )
          .count({count: 'id'})
          .first()
      ).count;

      cls.user_number_on_waiting_list = parseInt(numberOfPeopleInFrontOfUser) + 1;

    }));

    return exits.success(inputs.classes);

  },
};
