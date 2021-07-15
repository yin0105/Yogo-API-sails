const ObjectionClassWaitingListSignup = require('../../../objection-models/ClassWaitingListSignup');

module.exports = {

  friendlyName: 'Email: Customer waiting list signup converted to class signup',

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

    emailLogger.info('class-waiting-list-signup-converted-to-class-signup, waitingListSignupId: ' + waitingListSignupId);

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
      email_class_waiting_list_customer_moved_from_waiting_list_to_signup_subject: emailSubjectTemplate,
      email_class_waiting_list_customer_moved_from_waiting_list_to_signup_body: emailBodyTemplate,
      locale,
      email_bcc_to_client_on_customer_moved_from_waiting_list_to_class: bccToClient,
    } = await sails.helpers.clientSettings.find(waitingListSignup.client.id, [
      'email_class_waiting_list_customer_moved_from_waiting_list_to_signup_subject',
      'email_class_waiting_list_customer_moved_from_waiting_list_to_signup_body',
      'locale',
      'email_bcc_to_client_on_customer_moved_from_waiting_list_to_class',
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
      emailType: 'customer_moved_from_waiting_list_to_signup'
    });

    return exits.success();

  },

};
