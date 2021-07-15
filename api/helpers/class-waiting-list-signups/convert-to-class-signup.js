const knex = require('../../services/knex');
const ClassSignupObjection = require('../../objection-models/ClassSignup');

module.exports = {

  friendlyName: 'Convert waiting list signup to class signup',

  inputs: {
    waitingListSignup: {
      type: 'ref',
      description: 'The waiting list signup to convert to class signup',
      required: true,
    },
  },

  exits: {
    waitingListSignupNotFound: {
      description: 'Signup was not found in the database',
    },
  },

  fn: async (inputs, exits) => {

    const waitingListSignup = await ClassWaitingListSignup.findOne(
      sails.helpers.util.idOrObjectIdInteger(inputs.waitingListSignup),
    );

    if (!waitingListSignup) throw 'waitingListSignupNotFound';


    const affectedRowCount = await knex({cwls: 'class_waiting_list_signup'})
      .where({
        id: waitingListSignup.id,
        cancelled_at: 0,
      })
      .update({
        cancelled_at: Date.now(),
        class_pass_seat_spent: false,
      });

    if (!affectedRowCount) {
      return exits.success('Waiting list signup already cancelled.');
    }

    const classSignupData = {
      client_id: waitingListSignup.client,
      user_id: waitingListSignup.user,
      class_id: waitingListSignup.class,
      class_pass_seat_spent: waitingListSignup.class_pass_seat_spent,
    };

    classSignupData.used_class_pass_id = waitingListSignup.used_class_pass || undefined;
    classSignupData.used_membership_id = waitingListSignup.used_membership || undefined;

    const insertedClassSignup = await ClassSignupObjection.query()
      .insertAndFetch(classSignupData);


    await sails.helpers.email.customer.classWaitingListSignupConvertedToClassSignup(waitingListSignup);

    await sails.helpers.sms.customer.classWaitingListSignupConvertedToClassSignup(waitingListSignup);

    return exits.success(insertedClassSignup);

  },
};
