const ObjectionClassEmail = require('../../objection-models/ClassEmail');

module.exports = {
  friendlyName: 'Send to subsequent signups',

  description: 'Sends class emails to customers that have signed up after the initial email batch was sent',

  fn: async (inputs, exits) => {

    const classEmails = await ObjectionClassEmail.query()
      .where({
        email_sent: 1,
        archived: 0,
        auto_send_status: 'active',
      })
      .eager({
        'class': true,
      });

    const classes = _.map(classEmails, 'class');

    await sails.helpers.populate.classes.classHasStarted(classes);

    for (let i = 0; i < classEmails.length; i++) {
      const classEmail = classEmails[i];

      await sails.helpers.classEmail.send(classEmail.id);

      if (_.find(classes, {id: classEmail.class_id}).class_has_started) {
        await ClassEmail.update({id: classEmail.id}, {auto_send_status: 'done'});
      }
    }

    return exits.success();

  },
};
