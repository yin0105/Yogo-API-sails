const moment = require('moment-timezone');

module.exports = {
  friendlyName: 'Tick, cancel class waiting lists',

  description: 'Check if there are class waiting lists that should be cancelled.',

  fn: async function (inputs, exits) {

    const cancelClassWaitingListLogger = sails.helpers.logger('cancel-class-waiting-list');
    cancelClassWaitingListLogger.info('Starting cancel-class-waiting-list');

    const maxClassSignoffDeadline = await sails.helpers.clientSettings.getMax('class_signoff_deadline');
    const checkClassesDaysInFuture = Math.ceil(maxClassSignoffDeadline / 1440);

    const classesWithWaitingList = await knex({c: 'class'})
      .innerJoin({cwls: 'class_waiting_list_signup'}, 'cwls.class', 'c.id')
      .select('c.*')
      .where({
        'c.archived': false,
        'cwls.archived': false,
        'cwls.cancelled_at': 0,
      })
      .andWhere('seats', '>', 1)
      //.andWhere('c.date', '>=', moment.tz('Europe/Copenhagen').format('YYYY-MM-DD'))
      .andWhere('c.date', '<=', moment.tz('Europe/Copenhagen').add(checkClassesDaysInFuture, 'day').format('YYYY-MM-DD'))
      .groupBy('c.id');

    const maxPrivateClassSignoffDeadline = await sails.helpers.clientSettings.getMax('private_class_signoff_deadline');
    const checkPrivateClassesDaysInFuture = Math.ceil(maxPrivateClassSignoffDeadline / 1440);

    const privateClassesWithWaitingList = await knex({c: 'class'})
      .innerJoin({cwls: 'class_waiting_list_signup'}, 'cwls.class', 'c.id')
      .select('c.*')
      .where({
        'c.archived': false,
        'cwls.archived': false,
        'cwls.cancelled_at': 0,
      })
      .andWhere('seats', 1)
      //.andWhere('c.date', '>=', moment.tz('Europe/Copenhagen').format('YYYY-MM-DD'))
      .andWhere('c.date', '<=', moment.tz('Europe/Copenhagen').add(checkPrivateClassesDaysInFuture, 'day').format('YYYY-MM-DD'))
      .groupBy('c.id');

    const allClasses = _.concat(classesWithWaitingList, privateClassesWithWaitingList);

    await sails.helpers.populate.classes.classSignoffDeadlineHasBeenExceeded(allClasses);

    const classesNeedingToRemoveWaitingList = _.filter(allClasses, {class_signoff_deadline_has_been_exceeded: true});

    if (classesNeedingToRemoveWaitingList.length) {
      cancelClassWaitingListLogger.info('About to cancel waiting lists on class(es) with id(s): ' + _.map(classesNeedingToRemoveWaitingList, 'id'));

      await Promise.all(_.map(classesNeedingToRemoveWaitingList, async cls => sails.helpers.classes.cancelWaitingList(cls)));

      cancelClassWaitingListLogger.info('Done');
    } else {
      cancelClassWaitingListLogger.info('No classes currently need to remove waiting lists');
    }

    return exits.success();

  },

};
