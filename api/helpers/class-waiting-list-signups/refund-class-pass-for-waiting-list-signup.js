const moment = require('moment-timezone')
const knex = require('../../services/knex')

module.exports = {

  friendlyName: 'Refund class pass for waiting list signup',

  description: 'Refunds a class to a fixed_count class pass when the waiting list signup is destroyed.',

  inputs: {
    waitingListSignup: {
      type: 'ref',
      description: 'The waiting list signup to check used class pass and refund if relevant.',
      required: true,
    },
  },


  exits: {

    success: {
      outputType: 'string',
    },

    originalClassPassGone: {
      description: 'The class pass used to create the signup is not in the database anymore. This is a serious error, since class passes should never really be deleted, just archived.',
    },

  },


  fn: async (inputs, exits) => {

    const waitingListSignup = await ClassWaitingListSignup.findOne(
      sails.helpers.util.idOrObjectIdInteger(inputs.waitingListSignup),
    )

    if (!waitingListSignup.used_class_pass) return exits.success({classPassWasRefunded: false})

    let classPass = await ClassPass.findOne(waitingListSignup.used_class_pass).populate('class_pass_type')

    if (!classPass) throw 'originalClassPassGone'

    if (classPass.archived) {
      // Don't refund an archived class pass
      return exits.success({
        classPassWasRefunded: false,
        reasonForNotRefunding: 'classPassIsArchived',
        localizedReasonForNotRefunding: sails.helpers.t('classPass.classPassIsArchived')
      })
    }

    if (moment(classPass.valid_until, 'YYYY-MM-DD', 'Europe/Copenhagen').isBefore(moment.tz('Europe/Copenhagen'), 'day')) {
      // Don't refund an expired class pass
      return exits.success({
        classPassWasRefunded: false,
        reasonForNotRefunding: 'classPassHasExpired',
        localizedReasonForNotRefunding: sails.helpers.t('classPass.classPassHasExpired')
      })
    }

    if (classPass.class_pass_type.pass_type !== 'fixed_count') {
      // Unlimited classpasses do not need refunding
      return exits.success({
        classPassWasRefunded: false,
        reasonForNotRefunding: 'classPassIsUnlimited',
        localizedReasonForNotRefunding: sails.helpers.t('classPass.classPassIsUnlimited')
      })
    }


    // The original class pass is still active
    await knex.transaction(async function(trx) {

      await trx('class_pass')
        .where({id: classPass.id})
        .update({classes_left: knex.raw('classes_left + 1')});

      await trx('class_waiting_list_signup')
        .where({id: waitingListSignup.id})
        .update({class_pass_seat_spent: false});

    });


    return exits.success({
      classPassWasRefunded: true,
      previousNumberOfClasses: classPass.classes_left,
    })
  },

}
