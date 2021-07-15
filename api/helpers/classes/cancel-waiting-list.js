const ClassObjection = require('../../objection-models/Class');

module.exports = {
  friendlyName: 'Cancel class waiting list',

  inputs: {
    'class': {
      type: 'ref',
      required: true,
    },
  },

  fn: async (inputs, exits) => {

    const cancelClassWaitingListLogger = sails.helpers.logger('cancel-class-waiting-list');

    const classId = sails.helpers.util.idOrObjectIdInteger(inputs.class);
    cancelClassWaitingListLogger.info('cancel-waiting-list, classId: ' + classId);

    const classItem = await ClassObjection.query()
      .where('id', classId)
      .eager({
        waiting_list_signups: {
          user: true,
        },
        class_type: true,
        client: true,
      })
      .modifyEager(
        'waiting_list_signups',
        builder => builder.where({archived: false, cancelled_at: 0}),
      )
      .first();

    const {
      email_class_waiting_list_purged_customer_did_not_get_seat_subject: emailSubjectTemplate,
      email_class_waiting_list_purged_customer_did_not_get_seat_body: emailBodyTemplate,
      email_bcc_to_client_on_class_waiting_list_cancelled: bccToClient,
      locale,
    } = await sails.helpers.clientSettings.find(classItem.client.id, [
      'email_class_waiting_list_purged_customer_did_not_get_seat_subject',
      'email_class_waiting_list_purged_customer_did_not_get_seat_body',
      'email_bcc_to_client_on_class_waiting_list_cancelled',
      'locale',
    ]);

    await Promise.all(_.map(classItem.waiting_list_signups, async waitingListSignup => {

      const [emailSubject, emailBody] = await sails.helpers.string.fillInVariables(
        [emailSubjectTemplate, emailBodyTemplate],
        {},
        {
          'class': classItem,
          customer: waitingListSignup.user,
          studio: classItem.client,
        },
        locale,
      );

      cancelClassWaitingListLogger.info('Sending email to ' + waitingListSignup.user.first_name + ' ' + waitingListSignup.user.last_name + ' ' + waitingListSignup.user.email);

      await sails.helpers.email.send.with({
        user: waitingListSignup.user,
        subject: emailSubject,
        text: emailBody,
        blindCopyToClient: bccToClient,
        emailType: 'waiting_list_cancelled',
      });

      await sails.helpers.classWaitingListSignups.destroy(waitingListSignup);

    }));

    return exits.success();

  },
};
