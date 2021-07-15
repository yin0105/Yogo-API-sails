const ObjectionClassLivestreamSignup = require('../../../objection-models/ClassLivestreamSignup');

module.exports = {

  friendlyName: 'Email: Your class livestream will begin shortly',

  inputs: {
    classLivestreamSignup: {
      type: 'ref',
      description: 'The class livestream signup',
      required: true,
    },
  },


  fn: async (inputs, exits) => {

    const emailLogger = sails.helpers.logger('email');

    const classLivestreamSignupId = sails.helpers.util.idOrObjectIdInteger(inputs.classLivestreamSignup);

    const classLivestreamSignup = await ObjectionClassLivestreamSignup.query()
      .where('id', classLivestreamSignupId)
      .eager({
        user: true,
        'class': {
          class_type: true,
        },
        client: true,
      })
      .first();

    await sails.helpers.populate.classes.livestreamLink([classLivestreamSignup.class], classLivestreamSignup.user);

    emailLogger.info('your-class-livestream-will-begin-shortly, classLivestreamSignupId: ' + classLivestreamSignupId + ', classId: ' + classLivestreamSignup.class.id);

    const {
      livestream_email_to_customers_before_class_start_subject: emailSubjectTemplate,
      livestream_email_to_customers_before_class_start_body: emailBodyTemplate,
      locale,
      email_bcc_to_client_on_your_class_livestream_will_begin_shortly: bccToClient,
    } = await sails.helpers.clientSettings.find(classLivestreamSignup.client.id, [
      'livestream_email_to_customers_before_class_start_subject',
      'livestream_email_to_customers_before_class_start_body',
      'locale',
      'email_bcc_to_client_on_your_class_livestream_will_begin_shortly',
    ]);

    const [emailSubject, emailBody] = await sails.helpers.string.fillInVariables(
      [emailSubjectTemplate, emailBodyTemplate],
      {
        class_livestream_link: classLivestreamSignup.class.livestream_link,
      },
      {
        customer: classLivestreamSignup.user,
        studio: classLivestreamSignup.client,
        'class': classLivestreamSignup.class,
      },
      locale,
    );

    await sails.helpers.email.send.with({
      user: classLivestreamSignup.user,
      subject: emailSubject,
      text: emailBody,
      blindCopyToClient: bccToClient,
      emailType: 'your_class_livestream_will_begin_shortly'
    });

    await ClassLivestreamSignup.update({id: classLivestreamSignup.id}, {notification_email_sent: true});

    return exits.success();

  },

};
