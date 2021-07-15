module.exports = {

  friendlyName: 'Email: Your cancelled membership has ended',

  inputs: {
    membership: {
      type: 'ref',
      required: true,
    },
  },

  fn: async (inputs, exits) => {

    const cronLog = sails.helpers.cron.log;

    await cronLog('yourCancelledMembershipHasEnded');

    const membershipId = sails.helpers.util.idOrObjectIdInteger(inputs.membership);

    const membership = await Membership.findOne(membershipId)
      .populate('user')
      .populate('client')
      .populate('membership_type');

    let {
      email_your_cancelled_membership_has_ended_subject: subjectTemplate,
      email_your_cancelled_membership_has_ended_body: bodyTemplate,
      email_bcc_to_client_on_customer_cancel_or_resume_membership: bccToClient,
    } = await sails.helpers.clientSettings.find(
      membership.client, [
        'email_your_cancelled_membership_has_ended_subject',
        'email_your_cancelled_membership_has_ended_body',
        'email_bcc_to_client_on_customer_cancel_or_resume_membership',
      ]);

    const [subject, body] = await sails.helpers.string.fillInVariables(
      [subjectTemplate, bodyTemplate],
      {
        membership_name: membership.membership_type.name,
      },
      {
        customer: membership.user,
        studio: membership.client,
      },
    );

    // SEND THE EMAIL
    await sails.helpers.email.send.with({
      user: membership.user,
      subject: subject,
      text: body,
      blindCopyToClient: bccToClient,
      emailType: 'your_cancelled_membership_has_ended'
    });

    return exits.success();

  },

};
