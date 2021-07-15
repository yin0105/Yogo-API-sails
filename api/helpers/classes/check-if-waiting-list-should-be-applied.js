const ClassWaitingListSignupObj = require('../../objection-models/ClassWaitingListSignup');

module.exports = {
  friendlyName: 'Check if waiting list should be applied',

  description: 'Checks if there are free seats on the class and waiting list signups. In that case, moves the first waiting list signup over to a class signup.',

  inputs: {
    'class': {
      type: 'ref',
      required: true
    }
  },

  fn: async (inputs, exits) => {

    const classId = sails.helpers.util.idOrObjectIdInteger(inputs.class)

    const classItem = await Class.findOne(classId)

    const signupCount = (await knex({cs: 'class_signup'})
      .where({
        'class': classItem.id,
        archived: false,
        cancelled_at: 0,
      })
      .count({count: 'id'})
      .first()
    ).count

    if (signupCount < classItem.seats) {
      const waitingListSignups = await ClassWaitingListSignupObj.query()
        .where({
          class: classItem.id,
          archived: false,
          cancelled_at: 0,
        })
        .orderBy('createdAt', 'asc')
        .eager({
          used_class_pass: {
            class_pass_type: true
          }
        });

      const classDescription = await sails.helpers.classes.getDescription(classItem);

      for (let i = 0; i < classItem.seats - signupCount; i++) {
        if (!waitingListSignups.length) {
          break
        }
        const waitingListSignup = waitingListSignups.shift()
        await sails.helpers.classWaitingListSignups.convertToClassSignup(waitingListSignup);

        if (waitingListSignup.used_class_pass && waitingListSignup.used_class_pass.class_pass_type.pass_type === 'fixed_count') {
          const logMessage = sails.helpers.t('classPassLog.waitlistSignupConvertedToClassSignup', [classDescription])
          await sails.helpers.classPassLog.log(waitingListSignup.used_class_pass, logMessage);
        }


      }

    }

    return exits.success()

  }
}
