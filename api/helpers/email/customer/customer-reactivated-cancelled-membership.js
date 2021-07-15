module.exports = {

  friendlyName: 'Email: Customer re-activated previously cancelled membership',

  description: 'Sent to the customer when the customer re-activates a previously cancelled membership that has not yet expired',

  inputs: {
    membership: {
      type: 'ref',
      description: 'The membership that has been re-activated',
      required: true,
    },
  },


  fn: async (inputs, exits) => {

    await sails.helpers.cron.log('send membership re-activated email');

    const membershipId = sails.helpers.util.idOrObjectIdInteger(inputs.membership);

    const membership = await Membership.findOne(membershipId)
      .populate('client')
      .populate('membership_type')
      .populate('user')
      .populate('payment_option');

    let {
      email_customer_reactivated_cancelled_membership_subject: subjectTemplate,
      email_customer_reactivated_cancelled_membership_body: bodyTemplate,
      email_bcc_to_client_on_customer_cancel_or_resume_membership: bccToClient,
      locale,
    } = await sails.helpers.clientSettings.find(membership.client, [
      'email_customer_reactivated_cancelled_membership_subject',
      'email_customer_reactivated_cancelled_membership_body',
      'email_bcc_to_client_on_customer_cancel_or_resume_membership',
      'locale',
    ]);

    await sails.helpers.populate.memberships.nextPayment([membership]);

    const [subject, body] = await sails.helpers.string.fillInVariables(
      [subjectTemplate, bodyTemplate],
      {
        membership_type: membership.membership_type.name,
        next_payment_date: sails.helpers.util.formatDate(membership.next_payment.date, locale),
        next_payment_amount: membership.next_payment.amount,
      },
      {
        customer: membership.user,
        studio: membership.client,
      },
    );

    await sails.helpers.email.send.with({
      user: membership.user,
      subject: subject,
      text: body,
      blindCopyToClient: bccToClient,
      emailType: 'customer_reactivated_cancelled_membership',
    });


    await sails.helpers.cron.log('cancelled membership re-activated email sent');

    exits.success();

  },

};
