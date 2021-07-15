const ObjectionClassWaitingListSignup = require('../../../objection-models/ClassWaitingListSignup');

module.exports = {

  friendlyName: 'Email: Customer waiting list signup class was cancelled',

  inputs: {
    waitingListSignup: {
      type: 'ref',
      description: 'The waiting list signup',
      required: true,
    },
  },


  fn: async (inputs, exits) => {

    const emailLogger = sails.helpers.logger('email');

    const waitingListSignupId = sails.helpers.util.idOrObjectIdInteger(inputs.waitingListSignup);

    emailLogger.info('your-waiting-list-class-has-been-cancelled, waitingListSignupId: ' + waitingListSignupId);

    const waitingListSignup = await ObjectionClassWaitingListSignup.query()
      .where('id', waitingListSignupId)
      .eager({
        user: true,
        'class': {
          class_type: true,
        },
        client: true,
      })
      .first();

    const {
      email_your_waiting_list_class_has_been_cancelled_subject: emailSubjectTemplate,
      email_your_waiting_list_class_has_been_cancelled_body: emailBodyTemplate,
      locale,
      email_bcc_to_client_on_class_cancelled: bccToClient,
    } = await sails.helpers.clientSettings.find(waitingListSignup.client.id, [
      'email_your_waiting_list_class_has_been_cancelled_subject',
      'email_your_waiting_list_class_has_been_cancelled_body',
      'locale',
      'email_bcc_to_client_on_class_cancelled',
    ]);

    const [emailSubject, emailBody] = await sails.helpers.string.fillInVariables(
      [emailSubjectTemplate, emailBodyTemplate],
      {},
      {
        customer: waitingListSignup.user,
        studio: waitingListSignup.client,
        'class': waitingListSignup.class,
      },
      locale,
    );


    await sails.helpers.email.send.with({
      user: waitingListSignup.user,
      subject: emailSubject,
      text: emailBody,
      blindCopyToClient: bccToClient,
      emailType: 'your_waiting_list_class_has_been_cancelled',
    });

    return exits.success();

  },

};
