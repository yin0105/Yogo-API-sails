const moment = require('moment-timezone');
const knex = require('../../services/knex');

module.exports = {
  friendlyName: 'Send pending initial batches',

  description: 'Sends class emails that have been scheduled for at specific time',

  fn: async (inputs, exits) => {

    const classEmails = await knex({ce: 'class_email'})
      .where({
        email_sent: 0,
        archived: false,
      })
      .andWhere('send_at_datetime', '<=', moment.tz('Europe/Copenhagen').format('YYYY-MM-DD HH:mm:ss'));

    for (let i = 0; i < classEmails.length; i++) {
      const classEmail = classEmails[i];
      await sails.helpers.classEmail.send(classEmail.id);

      await ClassEmail.update(
        {id: classEmail.id},
        {email_sent: true},
      );
    }

    return exits.success();

  },
};
