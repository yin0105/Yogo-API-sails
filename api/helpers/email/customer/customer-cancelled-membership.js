module.exports = {

  friendlyName: 'Email: Customer cancelled membership',

  description: 'Sent to the cutomer when the customer cancels a membership',

  inputs: {
    membership: {
      type: 'ref',
      description: 'The membership that has been cancelled',
      required: true,
    },
  },


  fn: async (inputs, exits) => {

    await sails.helpers.cron.log('send membership cancelled email');

    const membershipId = sails.helpers.util.idOrObjectIdInteger(inputs.membership);

    const membership = await Membership.findOne(membershipId)
      .populate('client')
      .populate('membership_type')
      .populate('user')
      .populate('payment_option');

    let {
      email_customer_cancelled_membership_with_notice_subject: subjectWithCancellationNotice,
      email_customer_cancelled_membership_with_notice_body: bodyWithCancellationNotice,
      email_customer_cancelled_membership_without_notice_subject: subjectWithoutCancellationNotice,
      email_customer_cancelled_membership_without_notice_body: bodyWithoutCancellationNotice,
      email_bcc_to_client_on_customer_cancel_or_resume_membership: bccToClient,
      locale,
    } = await sails.helpers.clientSettings.find(membership.client, [
      'email_customer_cancelled_membership_with_notice_subject',
      'email_customer_cancelled_membership_with_notice_body',
      'email_customer_cancelled_membership_without_notice_subject',
      'email_customer_cancelled_membership_without_notice_body',
      'email_bcc_to_client_on_customer_cancel_or_resume_membership',
      'locale',
    ]);

    const membershipHasCancellationNotice = parseInt(membership.payment_option.number_of_months_payment_covers) === 1;

    await sails.helpers.populate.memberships.cancelledFromDateIncludingMembershipPause([membership]);

    const [subject, text] = await sails.helpers.string.fillInVariables(
      [
        membershipHasCancellationNotice ? subjectWithCancellationNotice : subjectWithoutCancellationNotice,
        membershipHasCancellationNotice ? bodyWithCancellationNotice : bodyWithoutCancellationNotice,
      ],
      {
        membership_type: membership.membership_type.name,
        cancelled_from_date: sails.helpers.util.formatDate(
          membership.cancelled_from_date_including_membership_pause,
          locale,
        ),
      },
      {
        customer: membership.user,
        studio: membership.client,
      },
    );

    await sails.helpers.email.send.with({
      user: membership.user,
      subject: subject,
      text: text,
      blindCopyToClient: bccToClient,
      emailType: 'customer_cancelled_membership',
    });

    await sails.helpers.cron.log('membership cancelled email sent');

    return exits.success();

  },

};
